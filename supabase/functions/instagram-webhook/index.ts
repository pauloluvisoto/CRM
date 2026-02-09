import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_VERIFY_TOKEN') || "crm_projetao_secret"
const PAGE_ACCESS_TOKEN = Deno.env.get('INSTAGRAM_PAGE_ACCESS_TOKEN') || ""

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

// Helper to get profile
async function getInstagramProfile(igsid: string) {
    if (!PAGE_ACCESS_TOKEN) return { name: "Instagram User", pic: null };
    try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${igsid}?fields=name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`);
        const data = await res.json();
        return {
            name: data.name || "Instagram User",
            pic: data.profile_pic || null
        };
    } catch (e) {
        console.error("Profile fetch error:", e);
        return { name: "Instagram User", pic: null };
    }
}

// Helper to ensure conversation and client exist
async function ensureConversationAndClient(igsid: string, lastMessage: string, profileVal: any = null) {
    // 1. Get Profile if not provided
    const profile = profileVal || await getInstagramProfile(igsid);

    // 2. Ensure Client Exists
    try {
        let { data: client } = await supabase.from('clients').select('id').eq('instagram_id', igsid).maybeSingle();
        if (!client) {
            // Create Client
            await supabase.from('clients').insert({
                name: profile.name,
                company_name: profile.name, // Fallback
                instagram_id: igsid,
                source: 'instagram',
                instagram_data: { profile_pic: profile.pic }
            });
        }
    } catch (e) {
        console.error("Client sync error:", e);
    }

    // 3. Ensure Conversation Exists
    try {
        let { data: conv } = await supabase.from('social_conversations')
            .select('id').eq('platform', 'instagram').eq('external_id', igsid).maybeSingle();

        if (!conv) {
            const { data: newConv, error } = await supabase.from('social_conversations').insert({
                platform: 'instagram',
                external_id: igsid,
                last_message: lastMessage
            }).select().single();
            if (error) throw error;
            return newConv.id;
        } else {
            // Update existing
            await supabase.from('social_conversations').update({
                last_message: lastMessage,
                updated_at: new Date().toISOString()
            }).eq('id', conv.id);
            return conv.id;
        }
    } catch (e) {
        console.error("Conversation sync error:", e);
        return null;
    }
}

serve(async (req) => {
    const { method } = req

    if (method === "OPTIONS") return new Response('ok', { headers: corsHeaders })

    const url = new URL(req.url)

    // Verification
    if (method === "GET") {
        const mode = url.searchParams.get("hub.mode")
        const token = url.searchParams.get("hub.verify_token")
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            return new Response(url.searchParams.get("hub.challenge"), { status: 200, headers: corsHeaders })
        }
        return new Response("Verification failed", { status: 403, headers: corsHeaders })
    }

    if (method === "POST") {
        const body = await req.json()

        // --- INBOUND WEBHOOK ---
        if (body.object === "instagram") {
            for (const entry of body.entry) {
                if (!entry.messaging) continue;
                for (const event of entry.messaging) {
                    if (event.message && event.message.text) {
                        // --- BUG FIX: IGNORE ECHOS ---
                        // Meta sends 'is_echo: true' when we send a message.
                        // We must skip these to avoid them being saved as 'inbound'.
                        if (event.message.is_echo) {
                            console.log("Ignoring message echo.");
                            continue;
                        }

                        const senderId = event.sender.id;
                        const text = event.message.text;

                        // Sync DB
                        const convId = await ensureConversationAndClient(senderId, text);

                        if (convId) {
                            await supabase.from('social_messages').insert({
                                conversation_id: convId,
                                content: text,
                                direction: 'inbound',
                                external_id: event.message.mid
                            });
                        }
                    }
                }
            }
            return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders })
        }

        // --- OUTBOUND API (Client sends to Meta) ---
        if (body.action === "send_message") {
            const { igsid, text } = body;

            if (!PAGE_ACCESS_TOKEN) {
                return new Response(JSON.stringify({ success: false, error: "Config missing" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            try {
                // TOKEN DIAGNOSTICS
                const checkRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${PAGE_ACCESS_TOKEN}`);
                const checkData = await checkRes.json();
                console.log("[TOKEN CHECK]", JSON.stringify(checkData));

                const permRes = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${PAGE_ACCESS_TOKEN}`);
                const permData = await permRes.json();
                console.log("[PERMISSIONS]", JSON.stringify(permData));

                console.log(`Sending message via Meta API to IGSID: ${igsid}`);
                // 1. Send to Meta (Using /me/ since it's the most reliable with a Page Token)
                const fbRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: { id: igsid },
                        message: { text },
                        messaging_type: "RESPONSE" // Added for stability
                    })
                });

                const fbData = await fbRes.json();
                if (!fbRes.ok) {
                    console.error("Meta API Error Details:", JSON.stringify(fbData));
                    return new Response(JSON.stringify({
                        success: false,
                        error: "Meta API Error",
                        details: fbData.error?.message || "Unknown error",
                        diagnostics: {
                            token_owner: checkData,
                            permissions: permData?.data?.map((p: any) => `${p.permission}: ${p.status}`)
                        },
                        meta_error: fbData
                    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                // 2. Save to DB (Persistence)
                // NOW we force create conversation if it doesn't exist
                const convId = await ensureConversationAndClient(igsid, text);

                if (convId) {
                    await supabase.from('social_messages').insert({
                        conversation_id: convId,
                        content: text,
                        direction: 'outbound',
                        external_id: fbData.message_id || fbData.mid
                    });
                }

                return new Response(JSON.stringify({ success: true, mid: fbData.message_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

            } catch (err) {
                return new Response(JSON.stringify({ success: false, error: "Internal Error", details: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        }

        return new Response("Not Found", { status: 404, headers: corsHeaders })
    }

    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders })
})
