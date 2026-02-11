import { supabase } from '../lib/supabaseClient';

const BASE_URL = import.meta.env.VITE_W_API_BASE_URL || 'https://api.w-api.app/v1';

// Main account token (for creating instances)
let ACCOUNT_TOKEN = import.meta.env.VITE_W_API_TOKEN || localStorage.getItem('wapi_account_token') || '';

// Active instance credentials
let INSTANCE_ID = localStorage.getItem('wapi_instance_id') || import.meta.env.VITE_W_API_INSTANCE_ID || '';
let INSTANCE_TOKEN = localStorage.getItem('wapi_instance_token') || '';

// Fetch active instance from DB (Supabase)
export const fetchRemoteActiveInstance = async () => {
    try {
        const { data, error } = await supabase
            .from('app_metadata')
            .select('value')
            .eq('key', 'active_wapi_instance_id')
            .single();

        if (data && data.value) {
            return data.value; // Returns instanceId string
        }
    } catch (error) {
        console.warn('Failed to fetch remote instance ID:', error);
    }
    return null;
};

// Update active instance in DB (Supabase)
export const updateRemoteActiveInstance = async (instanceId) => {
    try {
        await supabase
            .from('app_metadata')
            .upsert({
                key: 'active_wapi_instance_id',
                value: instanceId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
    } catch (error) {
        console.error('Failed to update remote instance ID:', error);
    }
};

// Helper to update account token (main token for creating/listing instances)
export const setAccountToken = (token) => {
    ACCOUNT_TOKEN = token;
    localStorage.setItem('wapi_account_token', token);
};

export const getAccountToken = () => ACCOUNT_TOKEN;

// Helper to set active instance credentials
export const setActiveInstance = (instanceId, instanceToken = '') => {
    INSTANCE_ID = instanceId;
    INSTANCE_TOKEN = instanceToken;
    localStorage.setItem('wapi_instance_id', instanceId);
    if (instanceToken) {
        localStorage.setItem('wapi_instance_token', instanceToken);
    }
};

export const getActiveInstance = () => ({
    instanceId: INSTANCE_ID,
    instanceToken: INSTANCE_TOKEN
});

// Get the correct token for requests (instance token if available, else account token)
const getActiveToken = () => INSTANCE_TOKEN || ACCOUNT_TOKEN;

export const getWApiCredentials = () => ({
    instanceId: INSTANCE_ID,
    token: getActiveToken(),
    accountToken: ACCOUNT_TOKEN,
    baseUrl: BASE_URL
});

// Legacy function for backwards compatibility
export const setWApiCredentials = (instanceId, token) => {
    setActiveInstance(instanceId, token);
};

const getHeaders = (useAccountToken = false) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${useAccountToken ? ACCOUNT_TOKEN : getActiveToken()}`
});

// ========================================
// INSTANCE MANAGEMENT (INTEGRATOR) 
// ========================================

/**
 * Create a new W-API instance
 * Returns { instanceId, token }
 */
export const createInstance = async (instanceName, options = {}) => {
    if (!ACCOUNT_TOKEN) throw new Error('Account Token is required to create instances');

    const body = {
        instanceName: instanceName || 'Nova Instância',
        rejectCalls: options.rejectCalls ?? true,
        callMessage: options.callMessage || 'Não estamos disponíveis no momento.'
    };

    // Optional webhooks
    if (options.webhookReceivedUrl) body.webhookReceivedUrl = options.webhookReceivedUrl;
    if (options.webhookDeliveryUrl) body.webhookDeliveryUrl = options.webhookDeliveryUrl;
    if (options.webhookConnectedUrl) body.webhookConnectedUrl = options.webhookConnectedUrl;
    if (options.webhookDisconnectedUrl) body.webhookDisconnectedUrl = options.webhookDisconnectedUrl;
    if (options.webhookStatusUrl) body.webhookStatusUrl = options.webhookStatusUrl;
    if (options.webhookPresenceUrl) body.webhookPresenceUrl = options.webhookPresenceUrl;

    const response = await fetch(`${BASE_URL}/integrator/create-instance`, {
        method: 'POST',
        headers: getHeaders(true), // Use account token
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create instance');
    }

    const result = await response.json();

    // Auto-save the new instance as active
    if (result.instanceId && result.token) {
        setActiveInstance(result.instanceId, result.token);

        // Auto-restart to initialize IP and port
        // The new instance may need a moment to be fully provisioned
        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for provisioning
            await restartInstance(result.instanceId);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s for restart
        } catch (restartError) {
            console.warn('Instance restart after creation failed:', restartError);
            // Continue anyway - user can manually restart
        }
    }

    return result;
};

/**
 * Initialize an instance (restart it to get IP/port)
 */
export const initializeInstance = async (instanceId) => {
    if (!instanceId) throw new Error('Instance ID is required');

    // First restart to initialize
    await restartInstance(instanceId);

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));

    return { success: true };
};

/**
 * List all instances in the account
 */
export const listInstances = async (page = 1, pageSize = 10) => {
    if (!ACCOUNT_TOKEN) throw new Error('Account Token is required');

    const response = await fetch(`${BASE_URL}/integrator/instances?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: getHeaders(true)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to list instances');
    }

    return await response.json();
};

/**
 * Delete an instance
 */
export const deleteInstance = async (instanceId) => {
    if (!ACCOUNT_TOKEN) throw new Error('Account Token is required');
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/integrator/delete-instance?instanceId=${instanceId}`, {
        method: 'DELETE',
        headers: getHeaders(true)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete instance');
    }

    // If deleted instance was active, clear it
    if (instanceId === INSTANCE_ID) {
        localStorage.removeItem('wapi_instance_id');
        localStorage.removeItem('wapi_instance_token');
        INSTANCE_ID = '';
        INSTANCE_TOKEN = '';
    }

    return await response.json();
};

// ========================================
// INSTANCE CONNECTION FUNCTIONS
// ========================================

/**
 * Get QR Code for connecting WhatsApp
 * Returns { qrcode: "data:image/png;base64,..." } or { message: "..." }
 */
export const getQRCode = async (instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/instance/qr-code?instanceId=${instanceId}&image=enable`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        // Try to parse as JSON for error message
        const text = await response.text();
        let errorMessage = 'Failed to get QR Code';
        try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
        } catch {
            // Check if it contains useful error info
            if (text.includes('IP') || text.includes('porta')) {
                errorMessage = text;
            }
        }
        throw new Error(errorMessage);
    }

    // Check content type to see if it's an image or JSON
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('image')) {
        // Response is a PNG image - convert to base64 data URL
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({ qrcode: reader.result });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } else {
        // Response is JSON
        const data = await response.json();

        // If it returns base64 string directly
        if (data.qrcode) {
            // Check if already a data URL
            if (data.qrcode.startsWith('data:')) {
                return data;
            }
            // Convert base64 to data URL
            return { qrcode: `data:image/png;base64,${data.qrcode}` };
        }

        return data;
    }
};

/**
 * Get Pairing Code (OTP) for phone connection
 */
export const getPairingCode = async (phoneNumber, instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');
    if (!phoneNumber) throw new Error('Phone number is required');

    const response = await fetch(`${BASE_URL}/instance/pairing-code?instanceId=${instanceId}&phoneNumber=${phoneNumber}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get pairing code');
    }

    return await response.json();
};

/**
 * Get Instance Status
 */
export const getInstanceStatus = async (instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/instance/status-instance?instanceId=${instanceId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get instance status');
    }

    return await response.json();
};

/**
 * Get Full Instance Data
 */
export const getInstanceData = async (instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/instance/fetch-instance?instanceId=${instanceId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get instance data');
    }

    return await response.json();
};

/**
 * Get Device Data (connected phone info)
 */
export const getDeviceInfo = async (instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/instance/device?instanceId=${instanceId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get device info');
    }

    return await response.json();
};

/**
 * Restart Instance
 */
export const restartInstance = async (instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/instance/restart?instanceId=${instanceId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to restart instance');
    }

    return await response.json();
};

/**
 * Disconnect Instance
 */
export const disconnectInstance = async (instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/instance/disconnect?instanceId=${instanceId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to disconnect instance');
    }

    return await response.json();
};

/**
 * Update Webhook URLs
 */
export const updateWebhook = async (webhookType, url, instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const endpoint = `/webhook/update-webhook-${webhookType}?instanceId=${instanceId}`;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ value: url })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update ${webhookType} webhook`);
    }

    return await response.json();
};

/**
 * Toggle Automatic Reading
 */
export const setAutoRead = async (enabled, instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/instance/update-auto-read-message?instanceId=${instanceId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ value: enabled })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update auto-read setting');
    }

    return await response.json();
};

/**
 * Check if phone number has WhatsApp
 */
export const checkPhoneExists = async (phoneNumber, instanceId = INSTANCE_ID) => {
    if (!instanceId) throw new Error('Instance ID is required');

    const response = await fetch(`${BASE_URL}/contacts/phone-exists?instanceId=${instanceId}&phoneNumber=${phoneNumber}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to check phone');
    }

    return await response.json();
};

// ========================================
// MESSAGING FUNCTIONS
// ========================================

export const wApi = {
    sendText: async (phone, message, replyToId = null) => {
        if (!INSTANCE_ID) {
            throw new Error('Instance ID missing - Configure in Settings');
        }

        const body = {
            phone,
            message,
            delayMessage: 1
        };

        if (replyToId) {
            body.messageId = replyToId;
        }

        try {
            const response = await fetch(`${BASE_URL}/message/send-text?instanceId=${INSTANCE_ID}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error sending text');
            }

            return await response.json();
        } catch (error) {
            console.error('W-API sendText error:', error);
            throw error;
        }
    },

    sendAudio: async (phone, audioUrl, replyToId = null) => {
        if (!INSTANCE_ID) throw new Error('Instance ID missing');

        const body = {
            phone,
            audio: audioUrl,
            delayMessage: 1
        };

        if (replyToId) {
            body.messageId = replyToId;
        }

        const response = await fetch(`${BASE_URL}/message/send-audio?instanceId=${INSTANCE_ID}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error sending audio');
        }

        return await response.json();
    },

    sendImage: async (phone, imageUrl, caption = '', replyToId = null) => {
        if (!INSTANCE_ID) throw new Error('Instance ID missing');

        const body = {
            phone,
            image: imageUrl,
            delayMessage: 1
        };

        if (caption) body.caption = caption;
        if (replyToId) body.messageId = replyToId;

        const response = await fetch(`${BASE_URL}/message/send-image?instanceId=${INSTANCE_ID}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error sending image');
        }

        return await response.json();
    },

    sendVideo: async (phone, videoUrl, caption = '', replyToId = null) => {
        if (!INSTANCE_ID) throw new Error('Instance ID missing');

        const body = {
            phone,
            video: videoUrl,
            delayMessage: 1
        };

        if (caption) body.caption = caption;
        if (replyToId) body.messageId = replyToId;

        const response = await fetch(`${BASE_URL}/message/send-video?instanceId=${INSTANCE_ID}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error sending video');
        }

        return await response.json();
    },

    sendDocument: async (phone, documentUrl, filename = 'document', replyToId = null) => {
        if (!INSTANCE_ID) throw new Error('Instance ID missing');

        const body = {
            phone,
            document: documentUrl,
            filename,
            delayMessage: 1
        };

        if (replyToId) body.messageId = replyToId;

        const response = await fetch(`${BASE_URL}/message/send-document?instanceId=${INSTANCE_ID}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error sending document');
        }

        return await response.json();
    },

    sendSticker: async (phone, stickerUrl, replyToId = null) => {
        if (!INSTANCE_ID) throw new Error('Instance ID missing');

        const body = {
            phone,
            sticker: stickerUrl,
            delayMessage: 1
        };

        if (replyToId) body.messageId = replyToId;

        const response = await fetch(`${BASE_URL}/message/send-sticker?instanceId=${INSTANCE_ID}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error sending sticker');
        }

        return await response.json();
    },

    sendGif: async (phone, gifUrl, replyToId = null) => {
        if (!INSTANCE_ID) throw new Error('Instance ID missing');

        const body = {
            phone,
            gif: gifUrl,
            delayMessage: 1
        };

        if (replyToId) body.messageId = replyToId;

        const response = await fetch(`${BASE_URL}/message/send-gif?instanceId=${INSTANCE_ID}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error sending gif');
        }

        return await response.json();
    },

    readMessage: async (phone, messageId = null) => {
        if (!INSTANCE_ID) return;

        const body = { phone };
        if (messageId) body.messageId = messageId;

        try {
            const response = await fetch(`${BASE_URL}/message/read-message?instanceId=${INSTANCE_ID}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                console.warn('W-API readMessage warning:', await response.text());
            }
        } catch (error) {
            console.error('W-API readMessage error:', error);
        }
    },

    fetchChats: async (page = 1, perPage = 20) => {
        if (!INSTANCE_ID) throw new Error('Instance ID missing');

        const response = await fetch(`${BASE_URL}/chats/fetch-chats?instanceId=${INSTANCE_ID}&perPage=${perPage}&page=${page}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error fetching chats');
        }

        return await response.json();
    }
};
