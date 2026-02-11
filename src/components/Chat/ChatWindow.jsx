import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Send, Phone, MoreVertical, Instagram, MessageCircle, Check, CheckCheck, Reply, X, Mic, Trash2, Pause, Play, Square, Image as ImageIcon, Info, Settings, Plus, Save, Globe, Lock, Copy, Smile } from 'lucide-react';
import ChatInfoPanel from './ChatInfoPanel';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { wApi } from '../../services/wApi';

// Custom Audio Player Component
const CustomAudioPlayer = ({ src, isOutbound }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio(src));
    const animationRef = useRef();
    const waveformRef = useRef(null);

    // Generate static visualizer bars once with fixed random heights
    const bars = useMemo(() => {
        return Array.from({ length: 40 }, () => ({
            height: Math.max(30, Math.random() * 100)
        }));
    }, [src]);

    useEffect(() => {
        const audio = audioRef.current;
        audio.src = src;

        const setAudioData = () => {
            setDuration(audio.duration);
        };

        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
            if (!audio.paused) {
                animationRef.current = requestAnimationFrame(updateProgress);
            }
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            cancelAnimationFrame(animationRef.current);
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('play', updateProgress);
        audio.addEventListener('timeupdate', () => setProgress((audio.currentTime / audio.duration) * 100));
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('play', updateProgress);
            audio.removeEventListener('ended', onEnded);
            cancelAnimationFrame(animationRef.current);
        };
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            cancelAnimationFrame(animationRef.current);
        } else {
            audio.play();
            setIsPlaying(true);
            animationRef.current = requestAnimationFrame(() => { });
        }
    };

    const handleSeek = (e) => {
        if (!waveformRef.current || !duration) return;
        const rect = waveformRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.min(Math.max(0, x / width), 1);
        const newTime = percentage * duration;

        audioRef.current.currentTime = newTime;
        setProgress(percentage * 100);
    };

    const formatTimeAudio = (time) => {
        if (!time || isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    return (
        <div className={`custom-audio-player ${isOutbound ? 'outbound-player' : 'inbound-player'}`}>
            <button onClick={togglePlay} className="play-btn">
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <div
                className="audio-waveform"
                ref={waveformRef}
                onClick={handleSeek}
                style={{ cursor: 'pointer' }}
            >
                {bars.map((bar, index) => (
                    <div
                        key={index}
                        className="waveform-bar"
                        style={{
                            height: `${bar.height}%`,
                            opacity: (index / bars.length) * 100 <= progress ? 1 : 0.5,
                            background: '#fff'
                        }}
                    />
                ))}
            </div>
            <span className="audio-duration">
                {formatTimeAudio(duration || 0)}
            </span>
        </div>
    );
};

const ChatWindow = ({ conversation, lastSelectedAt, onMessageSent }) => {
    const navigate = useNavigate();
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const messagesEndRef = useRef(null);
    const bodyRef = useRef(null);
    const textareaRef = useRef(null);
    const [showInfo, setShowInfo] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({ title: '', content: '', is_public: true });

    // Lista de emojis comuns
    const COMMON_EMOJIS = [
        '😊', '😂', '🤣', '❤️', '😍', '👍', '🔥', '🙏', '🎉', '🥰',
        '🤔', '😎', '😉', '😢', '😭', '😱', '😡', '👏', '🙌', '✨',
        '👀', '💯', '✔️', '❌', '⚠️', '⭐', '🚀', '⭐', '🎈', '🎁',
        '👋', '🤝', '💪', '🤳', '📍', '✅', '🌈', '☀️', '🌙', '☁️'
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addEmoji = (emoji) => {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = messageInput;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const newText = before + emoji + after;

        setMessageInput(newText);
        setShowEmojiPicker(false);

        // Colocar o foco de volta e ajustar cursor
        setTimeout(() => {
            textareaRef.current.focus();
            const newPos = start + emoji.length;
            textareaRef.current.setSelectionRange(newPos, newPos);
        }, 0);
    };
    const [templates, setTemplates] = useState([]);

    // Media States
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);
    const fileInputRef = useRef(null); // Ref for file input

    // Audio Visualizer Refs
    const visualizerCanvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Emoji & Template Suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [suggestionPrefix, setSuggestionPrefix] = useState(''); // ':' for emoji, '/' for template

    const EMOJIS = {
        'sorriso': '😊', 'legal': '👍', 'coracao': '❤️', 'fogo': '🔥', 'obrigado': '🙏',
        'festa': '🎉', 'olho': '👀', 'rindo': '😂', 'piscada': '😉', 'triste': '😢'
    };

    // Load templates from Supabase
    const fetchTemplates = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('internal_message_templates')
                .select('*');
            if (error) throw error;
            if (data) setTemplates(data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const saveTemplate = async (asNew = false) => {
        if (!templateForm.title || !templateForm.content) {
            alert('Por favor, preencha o título e o conteúdo.');
            return;
        }

        try {
            console.log('Saving template...', { asNew, templateForm });
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('Auth error or no user:', authError);
                // Fallback: If not logged in, try to save anyway (let Supabase handle RLS)
            }

            const payload = {
                title: templateForm.title,
                content: templateForm.content,
                is_public: templateForm.is_public,
                created_by: user?.id,
                updated_at: new Date().toISOString()
            };

            let result;
            if (editingTemplate && !asNew) {
                result = await supabase
                    .from('internal_message_templates')
                    .update(payload)
                    .eq('id', editingTemplate.id);
            } else {
                result = await supabase
                    .from('internal_message_templates')
                    .insert([payload]);
            }

            if (result.error) throw result.error;

            console.log('Save result:', result);
            setEditingTemplate(null);
            setTemplateForm({ title: '', content: '', is_public: true });
            fetchTemplates();
        } catch (err) {
            console.error('Error saving template:', err);
            alert(`Erro ao salvar: ${err.message || 'Verifique a conexão'}`);
        }
    };

    const handleInput = (e) => {
        const val = e.target.value;
        setMessageInput(val);

        const lastWord = val.split(/\s/).pop();
        if (lastWord.startsWith(':')) {
            const search = lastWord.slice(1).toLowerCase();
            const matches = Object.entries(EMOJIS)
                .filter(([name]) => name.startsWith(search))
                .map(([name, char]) => ({ label: `:${name}`, value: char, type: 'emoji' }));
            setSuggestions(matches);
            setSuggestionPrefix(':');
            setSelectedIndex(0);
        } else if (lastWord.startsWith('/')) {
            const search = lastWord.slice(1).toLowerCase();

            let matches = (templates || [])
                .filter(t => !search || t.title.toLowerCase().startsWith(search) || t.content.toLowerCase().includes(search))
                .map(t => ({ label: `/${t.title}`, value: t.content, type: 'template' }));

            matches.push({ label: '➕ Criar Novo Modelo...', value: 'CREATE_NEW', type: 'action' });

            setSuggestions(matches);
            setSuggestionPrefix('/');
            setSelectedIndex(0);
        } else {
            setSuggestions([]);
        }
    };

    const applySuggestion = (suggestion) => {
        if (suggestion.type === 'action' && suggestion.value === 'CREATE_NEW') {
            setShowTemplateManager(true);
            setSuggestions([]);
            return;
        }

        const parts = messageInput.split(/\s/);
        parts.pop(); // Remove the typed prefix
        const newValue = [...parts, suggestion.value].join(' ') + ' ';
        setMessageInput(newValue);
        setSuggestions([]);
        textareaRef.current?.focus();
    };
    // Keeping logic simple: Every click on inbox triggers markAsRead.

    const scrollToBottom = (behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        }
    };

    const markAsRead = async () => {
        if (!conversation?.id) return;
        const now = new Date().toISOString();

        // 1. Mark as read in Database (Supabase)
        const { error } = await supabase
            .from('social_messages')
            .update({ read_at: now })
            .eq('conversation_id', conversation.id)
            .eq('direction', 'inbound')
            .is('read_at', null);

        if (!error) {
            setMessages(prev => prev.map(m => (m.direction === 'inbound' && !m.read_at) ? { ...m, read_at: now } : m));

            // 2. Mark as read in WhatsApp API
            if (conversation.platform === 'whatsapp' && conversation.external_id) {
                // We send the phone number to mark the chat as read
                wApi.readMessage(conversation.external_id).catch(err => console.error('Failed to mark as read in WA:', err));
            }
        }
    };

    // Scroll more aggressively when messages change
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
            const timer = setTimeout(() => scrollToBottom("smooth"), 50);
            const timer2 = setTimeout(() => scrollToBottom("smooth"), 300); // Insurance backup
            return () => { clearTimeout(timer); clearTimeout(timer2); };
        }
    }, [messages]);

    // Handle selection and re-selection (re-click)
    useEffect(() => {
        if (lastSelectedAt) {
            markAsRead(); // Always mark as read when selecting/clicking a conversation
            setTimeout(() => scrollToBottom("auto"), 100);
        }
    }, [lastSelectedAt, conversation?.id]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '45px'; // Reset to min-height
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = scrollHeight + 'px';
        }
    }, [messageInput]);

    const handleKeyDown = (e) => {
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                applySuggestion(suggestions[selectedIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setSuggestions([]);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };
    const visualize = () => {
        if (!visualizerCanvasRef.current || !analyserRef.current) return;

        const canvas = visualizerCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Clear with transparency
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            // Dynamic width based on resolution - adjust multiplier to fill canvas
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 1.5;

                // Bright Green for visibility
                canvasCtx.fillStyle = '#22c55e';

                // Draw form bottom up with gap
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        };
        draw();
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setImageFile(file);
            } else if (file.type.startsWith('video/')) {
                setVideoFile(file);
            } else {
                setDocumentFile(file);
            }
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const fetchMessages = async () => {
        if (!conversation?.id) return;
        try {
            const { data, error } = await supabase
                .from('social_messages')
                .select('*')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formatted = data.map((msg, idx) => {
                return {
                    id: msg.id,
                    content: msg.content,
                    direction: msg.direction,
                    read_at: msg.read_at,
                    external_id: msg.external_id,
                    metadata: msg.metadata,
                    media_url: msg.media_url,
                    media_type: msg.media_type,
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            });

            setMessages(formatted);

            // Just scroll
            setTimeout(() => scrollToBottom("auto"), 150);
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    };

    // Fetch messages and subscribe when conversation changes
    useEffect(() => {
        if (!conversation?.id) return;

        fetchMessages();

        const channel = supabase
            .channel(`chat_${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'social_messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, (payload) => {
                // Ensure metadata is parsed if it's a string
                let msgMetadata = payload.new.metadata;
                if (typeof msgMetadata === 'string') {
                    try { msgMetadata = JSON.parse(msgMetadata); } catch (e) { msgMetadata = {}; }
                }

                const newMsg = {
                    id: payload.new.id,
                    content: payload.new.content,
                    direction: payload.new.direction,
                    read_at: payload.new.read_at,
                    external_id: payload.new.external_id,
                    metadata: msgMetadata || {},
                    media_url: payload.new.media_url,
                    media_type: payload.new.media_type,
                    time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    created_at: payload.new.created_at
                };

                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;

                    if (newMsg.direction === 'outbound') {
                        const clientId = newMsg.metadata?.client_id;

                        // Try matching by client_id first
                        if (clientId) {
                            const matchIdx = prev.findIndex(m => m.metadata?.client_id === clientId);
                            if (matchIdx !== -1) {
                                const next = [...prev];
                                next[matchIdx] = newMsg;
                                return next;
                            }
                        }

                        // Fallback: match by content AND time (within 60s) for messages from n8n or other sources
                        const newMsgTime = new Date(newMsg.created_at).getTime();
                        const matchIdx = prev.findIndex(m => {
                            if (m.direction !== 'outbound') return false;

                            // Check content similarity
                            const contentMatch = (m.content || '').trim().toLowerCase() === (newMsg.content || '').trim().toLowerCase();
                            if (!contentMatch) return false;

                            // Check if it's a temporary message or very recent (within 60s)
                            const isTemp = typeof m.id === 'string' && m.id.startsWith('temp_');
                            const mTime = m.created_at ? new Date(m.created_at).getTime() : Date.now();
                            const timeDiff = Math.abs(newMsgTime - mTime);

                            return isTemp || timeDiff < 60000;
                        });

                        if (matchIdx !== -1) {
                            const next = [...prev];
                            next[matchIdx] = newMsg;
                            return next;
                        }
                    }

                    return [...prev, newMsg];
                });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Chat connected!', conversation.id);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('Chat real-time connection error');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation?.id]);



    const startRecording = async () => {
        let stream = null;
        try {
            // 1. Request Microphone Access
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err) {
                console.error('Microphone permission error:', err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    alert('Acesso ao microfone negado. Por favor, permita o acesso nas configurações do navegador.');
                } else {
                    alert(`Erro ao acessar microfone: ${err.message}`);
                }
                return;
            }

            // 2. Audio Visualization Setup
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            // 3. Phantom Video Track Setup (Instagram Compatibility)
            let mediaRecorder;
            let mimeType = '';

            try {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 100, 100);

                const videoStream = canvas.captureStream(1); // 1 FPS is enough
                const combinedStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                    ...stream.getAudioTracks()
                ]);

                // Prioritize MP4, then WebM with H264, then Standard WebM
                const types = [
                    'video/mp4',
                    'video/webm;codecs=h264',
                    'video/webm;codecs=vp8',
                    'video/webm'
                ];

                for (const type of types) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        mimeType = type;
                        break;
                    }
                }

                // If no video type supported, verify audio types
                if (!mimeType) {
                    console.warn('No video MIME type supported for Instagram compat. Falling back to audio.');
                    throw new Error('No supported video mime found');
                }

                mediaRecorder = new MediaRecorder(combinedStream, { mimeType });

                // Keep reference to stop tracks later
                mediaRecorder.videoStreamRef = videoStream;

            } catch (videoError) {
                console.warn('Video-phantom setup failed, falling back to audio-only:', videoError);
                // Fallback: Pure Audio
                const audioTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/mp4'];
                for (const type of audioTypes) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        mimeType = type;
                        break;
                    }
                }
                mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            }

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                // Determine extension based on mimeType
                // WhatsApp prefers OGG (Opus)
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);

                // Cleanup Tracks
                stream.getTracks().forEach(track => track.stop());
                if (mediaRecorder.videoStreamRef) {
                    mediaRecorder.videoStreamRef.getTracks().forEach(track => track.stop());
                }

                if (audioContextRef.current) {
                    audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
                }
                cancelAnimationFrame(animationFrameRef.current);
            };

            mediaRecorder.start(100); // 100ms timeslice for smoother data availability
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);

            // Start visualizer
            setTimeout(visualize, 100);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Fatal recording error:', err);
            alert(`Erro fatal ao gravar: ${err.message}`);
            // Ensure cleanup if simple start failed
            if (stream) stream.getTracks().forEach(t => t.stop());
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            visualize();
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const discardRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timerRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
        cancelAnimationFrame(animationFrameRef.current);

        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        setAudioBlob(null);
        chunksRef.current = [];
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSend = async (e, type = 'text', contentOverride = null) => {
        if (e) e.preventDefault();

        // Auto-detect type if not forced
        if (type === 'text') {
            if (audioBlob) type = 'audio';
            if (imageFile) {
                if (imageFile.type === 'image/gif') type = 'gif';
                else if (imageFile.type === 'image/webp') type = 'sticker';
                else type = 'image';
            }
            if (videoFile) type = 'video';
            if (documentFile) type = 'document';
        }

        const content = contentOverride || messageInput;
        if (!content && !audioBlob && !imageFile && !videoFile && !documentFile) return;

        let finalContent = content;
        let metadata = replyTo ? { reply_to: replyTo } : {};

        try {
            // Upload Logic
            if (type === 'audio' && audioBlob) {
                // Force .ogg extension for W-API compatibility
                const fileName = `audio_${Date.now()}.ogg`;
                const { data, error } = await supabase.storage
                    .from('chat-media')
                    .upload(fileName, audioBlob, {
                        contentType: 'audio/ogg' // Force content type
                    });
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(fileName);
                finalContent = publicUrl;
                metadata.type = 'audio';
            } else if (type === 'image' && imageFile) {
                // Determine extension based on MIME type for safety
                let fileExt = imageFile.name.split('.').pop();
                if (imageFile.type === 'image/jpeg') fileExt = 'jpg';
                else if (imageFile.type === 'image/png') fileExt = 'png';

                // Force a safe filename
                const fileName = `image_${Date.now()}.${fileExt}`;

                const { error } = await supabase.storage
                    .from('chat-media')
                    .upload(fileName, imageFile, {
                        contentType: imageFile.type // Explicitly set content type
                    });

                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(fileName);
                finalContent = publicUrl;
                metadata.type = (imageFile.type === 'image/gif') ? 'gif' :
                    (imageFile.type === 'image/webp') ? 'sticker' : 'image';
            } else if (type === 'video' && videoFile) {
                const fileExt = videoFile.name.split('.').pop() || 'mp4';
                const fileName = `video_${Date.now()}.${fileExt}`;

                const { error } = await supabase.storage
                    .from('chat-media')
                    .upload(fileName, videoFile, { contentType: videoFile.type });

                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(fileName);
                finalContent = publicUrl;
                metadata.type = 'video';
            } else if (type === 'document' && documentFile) {
                const fileName = `doc_${Date.now()}_${documentFile.name}`;
                const { error } = await supabase.storage
                    .from('chat-media')
                    .upload(fileName, documentFile, { contentType: documentFile.type });

                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(fileName);
                finalContent = publicUrl;
                metadata.type = 'document';
                metadata.filename = documentFile.name;
            }
        } catch (err) {
            console.error('Error uploading media:', err);
            alert('Erro ao fazer upload da mídia.');
            return;
        }

        // Clear States
        setMessageInput('');
        setAudioBlob(null);
        setImageFile(null);
        setVideoFile(null);
        setDocumentFile(null);
        setRecordingTime(0);
        setReplyTo(null);
        markAsRead(); // Mark all prev inbound as read when I reply
        const currentReply = replyTo;

        // Optimistic UI Update with Client ID for Deduplication
        const clientId = Date.now().toString();
        const optimisticMsg = {
            id: `temp_${Date.now()}`, // String-based Temporary ID
            content: finalContent,
            direction: 'outbound',
            read_at: null,
            metadata: { ...metadata, client_id: clientId, type },
            media_url: type !== 'text' ? finalContent : null,
            media_type: type,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        // Optimistic Inbox Update
        const prefix = 'Você: ';
        let msgPreview = finalContent;
        if (type === 'audio') msgPreview = '🎵 Áudio';
        else if (type === 'image') msgPreview = '📷 Imagem';
        else if (type === 'video') msgPreview = '🎥 Vídeo';
        else if (type === 'document') msgPreview = '📄 Arquivo';
        else if (type === 'gif') msgPreview = '🎞️ GIF';
        else if (type === 'sticker') msgPreview = '👾 Figurinha';
        if (onMessageSent) onMessageSent(prefix + msgPreview);

        try {
            // 1. Save to Database with Track ID (COMMENTED OUT TO AVOID DUPLICATES - N8N/Webhook handles this)
            /*
            const { error: dbError } = await supabase
                .from('social_messages')
                .insert({
                    conversation_id: conversation.id,
                    content: finalContent,
                    direction: 'outbound',
                    metadata: { ...metadata, client_id: clientId, type }
                });

            if (dbError) console.error('Error saving message to DB:', dbError);
            */

            // 2. Update Conversation Last Message with "Você:" and Reset Unread
            const prefix = 'Você: ';
            let msgPreview = finalContent;
            if (type === 'audio') msgPreview = '🎵 Áudio';
            else if (type === 'image') msgPreview = '📷 Imagem';
            else if (type === 'video') msgPreview = '🎥 Vídeo';
            else if (type === 'document') msgPreview = '📄 Arquivo';
            else if (type === 'gif') msgPreview = '🎞️ GIF';
            else if (type === 'sticker') msgPreview = '👾 Figurinha';

            const { error: convError } = await supabase
                .from('social_conversations')
                .update({
                    last_message: prefix + msgPreview,
                    last_message_at: new Date().toISOString(),
                    unread_count: 0
                })
                .eq('id', conversation.id);

            if (convError) console.error('Error updating conversation:', convError);

            // 3. Send to API based on Platform
            let response;
            if (conversation.platform === 'whatsapp') {
                const phone = conversation.external_id; // Using external_id as phone number
                const replyToId = currentReply?.external_id;

                console.log('Sending via WhatsApp:', { type, phone, finalContent });

                if (type === 'text') {
                    await wApi.sendText(phone, finalContent, replyToId);
                } else if (type === 'audio') {
                    // finalContent is publicUrl from Supabase Storage
                    await wApi.sendAudio(phone, finalContent, replyToId);
                } else if (type === 'image') {
                    await wApi.sendImage(phone, finalContent, '', replyToId);
                } else if (type === 'video') {
                    await wApi.sendVideo(phone, finalContent, '', replyToId);
                } else if (type === 'document') {
                    await wApi.sendDocument(phone, finalContent, metadata.filename || 'document', replyToId);
                } else if (type === 'sticker') {
                    await wApi.sendSticker(phone, finalContent, replyToId);
                } else if (type === 'gif') {
                    await wApi.sendGif(phone, finalContent, replyToId);
                }
            } else {
                // Default to Instagram via n8n
                response = await fetch('https://backend-recuperaia-n.snpserv.online/webhook/enviar-mensagem-instagram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        igsid: conversation.external_id,
                        text: finalContent,
                        type: type, // 'text', 'audio' or 'image'
                        conversation_id: conversation.id,
                        reply_to: currentReply ? {
                            id: currentReply.id,
                            external_id: currentReply.external_id,
                            text: currentReply.content
                        } : null
                    })
                });

                if (!response.ok) throw new Error('Erro ao enviar para o n8n');
            }
        } catch (err) {
            console.error('Detailed Error:', err);
            // Optional: Add UI feedback for error here
            alert(`Erro ao enviar mensagem: ${err.message}`);
        }
    };

    return (
        <div className="window-container">
            <div className="chat-main-area">
                <div className="window-header">
                    <div
                        className="header-info"
                        onClick={() => conversation.contact_id && navigate(`/clients/${conversation.contact_id}`)}
                        style={{ cursor: conversation.contact_id ? 'pointer' : 'default' }}
                    >
                        <div className="avatar-small">
                            {conversation.picture_url ? (
                                <img src={conversation.picture_url} alt="" className="avatar-img" />
                            ) : (
                                (conversation.contact_name || '?').charAt(0)
                            )}
                        </div>
                        <div>
                            <div className="contact-name">
                                {conversation.contact_name}
                                <span className="platform-tag">
                                    {conversation.platform === 'whatsapp' ? <MessageCircle size={12} /> : <Instagram size={12} />}
                                    {conversation.platform}
                                </span>
                            </div>
                            <div className="status">Online</div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn" onClick={() => setShowInfo(!showInfo)} title="Informações do contato">
                            <Info size={20} />
                        </button>
                    </div>
                </div>

                <div className="messages-body" ref={bodyRef}>
                    {messages.map((msg, index) => {
                        const isLastMsg = index === messages.length - 1;
                        const replyData = msg.metadata?.reply_to;

                        // Robust Media Detection
                        const content = msg.content || '';

                        // Prioritize database media_type/url
                        const mediaType = msg.media_type || msg.metadata?.type;
                        const mediaUrl = msg.media_url || (mediaType && mediaType !== 'text' ? msg.content : null);

                        const isAudio = mediaType === 'audio' ||
                            (!mediaType && content.match(/\.(mp3|mp4|webm|m4a|ogg|opus)(\?.*)?$/i));

                        const isImage = mediaType === 'image' ||
                            (!mediaType && content.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i));

                        const isSticker = mediaType === 'sticker';
                        const isGif = mediaType === 'gif';
                        const isVideo = mediaType === 'video' || (!mediaType && content.match(/\.(mp4|mov|avi)(\?.*)?$/i));
                        const isDocument = mediaType === 'document';

                        // Use mediaUrl for player/image if available, otherwise content
                        const displaySrc = mediaUrl || content;

                        return (
                            <React.Fragment key={msg.id}>
                                <div className={`message-row ${msg.direction}`}>
                                    <div className="message-bubble-wrapper">

                                        {isImage ? (
                                            <div className="image-bubble">
                                                <img
                                                    src={displaySrc}
                                                    alt="Imagem"
                                                    className="chat-image-content"
                                                    onClick={() => window.open(displaySrc, '_blank')}
                                                />
                                                <div className="image-meta-overlay">
                                                    <div className="msg-footer">
                                                        <span className="time">{msg.time}</span>
                                                        {msg.direction === 'inbound' && (
                                                            <span className="status-icon">
                                                                {msg.read_at ? <CheckCheck size={14} /> : <Check size={14} />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isSticker ? (
                                            <div className="image-bubble" style={{ background: 'transparent', boxShadow: 'none' }}>
                                                <img
                                                    src={displaySrc}
                                                    alt="Sticker"
                                                    className="chat-image-content"
                                                    style={{ maxWidth: '150px' }}
                                                />
                                                <div className="msg-footer" style={{ position: 'absolute', bottom: 0, right: 0, padding: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}>
                                                    <span className="time" style={{ fontSize: '10px', color: 'white' }}>{msg.time}</span>
                                                </div>
                                            </div>
                                        ) : (isGif || isVideo) ? (
                                            <div className="message-bubble">
                                                <video
                                                    src={displaySrc}
                                                    controls={!isGif}
                                                    autoPlay={isGif}
                                                    loop={isGif}
                                                    muted={isGif}
                                                    playsInline
                                                    style={{ maxWidth: '100%', borderRadius: '12px' }}
                                                />
                                                <div className="msg-footer">
                                                    <span className="time">{msg.time}</span>
                                                    {msg.direction === 'inbound' && (
                                                        <span className="status-icon">
                                                            {msg.read_at ? <CheckCheck size={14} /> : <Check size={14} />}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : isDocument ? (
                                            <div className="message-bubble" style={{ minWidth: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px' }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px' }}>
                                                        <FileText size={24} color="var(--primary)" />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {msg.metadata?.filename || 'Arquivo'}
                                                        </div>
                                                        <a
                                                            href={displaySrc}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}
                                                        >
                                                            Baixar arquivo
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="msg-footer">
                                                    <span className="time">{msg.time}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="message-bubble">
                                                {replyData && (
                                                    <div className="reply-preview-in-msg">
                                                        <span className="reply-text-small">{replyData.content || replyData.text}</span>
                                                    </div>
                                                )}

                                                {isAudio ? (
                                                    <CustomAudioPlayer src={displaySrc} isOutbound={msg.direction === 'outbound'} />
                                                ) : (
                                                    <div className="text-content">
                                                        {msg.content}
                                                        <div className="msg-footer">
                                                            <span className="time">{msg.time}</span>
                                                            {msg.direction === 'inbound' && (
                                                                <span className="status-icon">
                                                                    {msg.read_at ? <CheckCheck size={14} /> : <Check size={14} />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div >

                {
                    replyTo && (
                        <div className="reply-bar">
                            <div className="reply-content">
                                <span className="reply-label">Respondendo a</span>
                                <span className="reply-text">{replyTo.content}</span>
                            </div>
                            <button className="close-reply" onClick={() => setReplyTo(null)}>
                                <X size={16} />
                            </button>
                        </div>
                    )
                }

                <div className="input-area-wrapper">
                    {isRecording ? (
                        <div className="recording-overlay">
                            <div className="recording-info">
                                <div className="recording-dot"></div>
                                <span className="recording-timer">{formatTime(recordingTime)}</span>
                                <div className="recording-visualizer" style={{ flex: 1, height: '40px', display: 'flex', alignItems: 'center', marginLeft: '1.5rem', minWidth: '100px' }}>
                                    <canvas ref={visualizerCanvasRef} width="300" height="50" style={{ width: '100%', height: '100%' }} />
                                </div>
                            </div>
                            <div className="recording-actions">
                                <button className="record-btn-action discard" onClick={discardRecording}>
                                    <Trash2 size={20} />
                                </button>
                                <button className="record-btn-action pause" onClick={isPaused ? resumeRecording : pauseRecording}>
                                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                                </button>
                                <button className="record-btn-action stop" onClick={stopRecording}>
                                    <Square size={20} />
                                </button>
                            </div>
                        </div>
                    ) : audioBlob ? (
                        <div className="audio-preview-bar">
                            <div className="preview-info">
                                <Mic size={16} />
                                <span>Áudio pronto para enviar</span>
                            </div>
                            <div className="preview-actions">
                                <button className="record-btn-action discard" onClick={() => setAudioBlob(null)}>
                                    <Trash2 size={20} />
                                </button>
                                <button className="send-btn" onClick={() => handleSend(null, 'audio')}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : videoFile ? (
                        <div className="audio-preview-bar">
                            <div className="preview-info">
                                <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>🎥</span>
                                <span>Vídeo selecionado</span>
                            </div>
                            <div className="preview-actions">
                                <button className="record-btn-action discard" onClick={() => { setVideoFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                    <Trash2 size={20} />
                                </button>
                                <button className="send-btn" onClick={() => handleSend(null, 'video')}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : documentFile ? (
                        <div className="audio-preview-bar">
                            <div className="preview-info">
                                <FileText size={16} />
                                <span>{documentFile.name} (Pronto para enviar)</span>
                            </div>
                            <div className="preview-actions">
                                <button className="record-btn-action discard" onClick={() => { setDocumentFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                    <Trash2 size={20} />
                                </button>
                                <button className="send-btn" onClick={() => handleSend(null, 'document')}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : imageFile ? (
                        <div className="audio-preview-bar">
                            <div className="preview-info">
                                <ImageIcon size={16} />
                                <span>Imagem selecionada</span>
                            </div>
                            <div className="preview-actions">
                                <button className="record-btn-action discard" onClick={() => { setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                    <Trash2 size={20} />
                                </button>
                                <button className="send-btn" onClick={() => handleSend(null, 'image')}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="input-area" onSubmit={(e) => handleSend(e)}>
                            <input
                                type="file"
                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                            />

                            <div className="input-left-actions">
                                <button type="button" className="mic-btn" onClick={() => fileInputRef.current?.click()} title="Anexar imagem">
                                    <Plus size={24} />
                                </button>

                                <div className="emoji-picker-container" ref={emojiPickerRef}>
                                    <button
                                        type="button"
                                        className="emoji-trigger-btn"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        title="Emoji"
                                    >
                                        <Smile size={24} />
                                    </button>

                                    {showEmojiPicker && (
                                        <div className="emoji-popup">
                                            <div className="emoji-grid">
                                                {COMMON_EMOJIS.map((emoji, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        className="emoji-select-btn"
                                                        onClick={() => addEmoji(emoji)}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="input-wrapper">
                                {suggestions.length > 0 && (
                                    <div className="suggestions-popover">
                                        {suggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                className={`suggestion-item ${i === selectedIndex ? 'active' : ''}`}
                                                data-type={s.type}
                                                onClick={() => applySuggestion(s)}
                                            >
                                                <span className="suggestion-label">{s.label}</span>
                                                {s.type !== 'action' && <span className="suggestion-preview">{s.value}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    placeholder="Digite uma mensagem"
                                    value={messageInput}
                                    onChange={handleInput}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    maxLength={1000}
                                />
                            </div>

                            <div className="input-right-actions">
                                {!messageInput.trim() ? (
                                    <button type="button" className="mic-btn" onClick={startRecording} title="Gravar áudio">
                                        <Mic size={24} />
                                    </button>
                                ) : (
                                    <button type="submit" className="send-btn-wa" title="Enviar">
                                        <Send size={22} />
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
            {showInfo && <ChatInfoPanel conversation={conversation} onClose={() => setShowInfo(false)} />}

            <style>{`
                .window-container { display: flex; flex-direction: row; height: 100%; overflow: hidden; }
                .chat-main-area { display: flex; flex-direction: column; flex: 1; height: 100%; min-width: 0; position: relative; }

                .window-header {
                    padding: 0.75rem 1.5rem;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                    display: flex; justify-content: space-between; align-items: center;
                }

                .header-info { display: flex; align-items: center; gap: 1rem; }
                .avatar-small {
                    width: 36px; height: 36px; background: #444; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; color: white;
                    overflow: hidden;
                }
                .avatar-img { width: 100%; height: 100%; object-fit: cover; }
                .contact-name { font-weight: 700; display: flex; align-items: center; gap: 8px; font-size: 1.1rem; }
                .platform-tag {
                    font-size: 0.7rem; font-weight: 400; background: rgba(255,255,255,0.05);
                    padding: 3px 8px; border-radius: 6px; display: flex; align-items: center; gap: 6px;
                    text-transform: capitalize; color: var(--text-muted);
                }
                .status { font-size: 0.8rem; color: #4ade80; display: flex; align-items: center; gap: 6px; }
                .status::before { content: ""; width: 8px; height: 8px; background: #4ade80; border-radius: 50%; display: inline-block; }

                .messages-body {
                    flex: 1;
                    padding: 2rem;
                    display: flex; flex-direction: column; gap: 8px;
                    overflow-y: auto;
                    background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
                }

                .message-row { display: flex; width: 100%; margin-bottom: 4px; position: relative; }
                .message-row.outbound { justify-content: flex-end; }
                .message-row.inbound { justify-content: flex-start; }

                .bubble-actions {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    display: none;
                    gap: 4px;
                }
                .outbound .bubble-actions { left: -40px; }
                .inbound .bubble-actions { right: -40px; }
                
                .message-row:hover .bubble-actions { display: flex; }
                
                .action-btn {
                    background: var(--bg-surface);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-secondary);
                    width: 30px; height: 30px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-btn:hover { background: var(--bg-hover); color: white; }

                .message-bubble-wrapper {
                   max-width: 70%;
                   animation: fadeIn 0.2s ease-out;
                   position: relative;
                }

                .unread-divider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 1.5rem 0;
                    width: 100%;
                }
                .divider-line {
                    flex: 1;
                    height: 1px;
                    background: rgba(180, 240, 58, 0.3);
                }
                .divider-text {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--primary);
                    background: rgba(180, 240, 58, 0.1);
                    padding: 4px 12px;
                    border-radius: 12px;
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .message-bubble {
                    padding: 0.8rem 1.2rem;
                    border-radius: 18px;
                    position: relative;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    display: flex; flex-direction: column;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    word-break: break-word;
                }

                /* --- New Instagram-like Media Styles --- */

                .custom-audio-player {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 4px 0; /* Minimal padding inside bubble */
                    min-width: 200px;
                    height: 38px;
                }
                
                .custom-audio-player {
                    color: white;
                }

                .outbound .play-btn { background: rgba(255,255,255,0.1); }
                .outbound .play-btn:hover { background: rgba(255,255,255,0.2); }
                .inbound .play-btn { background: rgba(255,255,255,0.1); }
                .inbound .play-btn:hover { background: rgba(255,255,255,0.2); }

                .audio-waveform {
                    display: flex; align-items: center; gap: 2px;
                    flex: 1; height: 20px;
                }
                .waveform-bar {
                    width: 3px;
                    border-radius: 2px;
                    transition: height 0.2s;
                }

                .audio-duration {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    min-width: 30px;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }

                /* Image Styles - Standalone Bubble */
                .image-bubble {
                    position: relative;
                    max-width: 100%; /* Let wrapper constrain it */
                    border-radius: 18px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    cursor: pointer;
                    margin-bottom: 4px;
                }
                .chat-image-content {
                    width: 100%;
                    height: auto;
                    display: block;
                    max-height: 400px; 
                    object-fit: cover;
                }
                .image-meta-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 30px 12px 8px; /* High top padding for gradient fade */
                    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 6px;
                    color: white;
                    font-size: 0.75rem;
                    pointer-events: none;
                }

                .reply-preview-in-msg {
                    background: rgba(0,0,0,0.1);
                    border-left: 3px solid rgba(0,0,0,0.3);
                    padding: 8px;
                    margin-bottom: 8px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    max-width: 100%;
                    overflow: hidden;
                }
                .inbound .reply-preview-in-msg {
                    background: rgba(255,255,255,0.05);
                    border-left-color: var(--primary);
                }

                .reply-text-small {
                    opacity: 0.8;
                    font-style: italic;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: normal;
                    word-break: break-word;
                }

                .outbound .message-bubble {
                    background: #2d4a22;
                    color: #ffffff;
                    border-bottom-right-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .inbound .message-bubble {
                    background-color: #050a07;
                    color: var(--text-primary);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-bottom-left-radius: 4px;
                }

                .reply-bar {
                    background: var(--bg-surface);
                    border-top: 1px solid var(--border-color);
                    padding: 12px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    animation: slideUp 0.2s ease-out;
                    border-left: 4px solid var(--primary);
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .reply-content { display: flex; flex-direction: column; gap: 2px; }
                .reply-label { font-size: 0.75rem; font-weight: 700; color: var(--primary); }
                .reply-text { font-size: 0.85rem; color: var(--text-secondary); opacity: 0.8; }
                .close-reply { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
                .close-reply:hover { color: white; }

                .msg-footer {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 4px;
                    margin-top: 4px;
                    margin-left: 8px;
                    float: right;
                    font-size: 0.7rem;
                    line-height: 1;
                }

                .outbound .msg-footer { color: rgba(255, 255, 255, 0.5); }
                .inbound .msg-footer { color: rgba(255, 255, 255, 0.4); }

                .msg-footer .status-icon {
                    display: flex;
                    align-items: center;
                    color: inherit;
                }

                .input-area-wrapper {
                    background: #11121a;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding: 8px 16px;
                }

                .input-area {
                    background: #202c33;
                    border-radius: 26px;
                    padding: 4px 14px;
                    display: flex;
                    align-items: center; 
                    gap: 8px; /* Increased gap for better breathing room */
                    min-height: 52px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }

                .input-left-actions, .input-right-actions {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    width: 90px; /* Equal width to center the wrapper */
                    flex-shrink: 0;
                }

                .input-right-actions {
                    justify-content: flex-end;
                }

                .input-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    min-width: 0;
                    margin: 0 2px;
                    position: relative; /* For absolute positioning of popover */
                }

                .suggestions-popover {
                    position: absolute;
                    bottom: calc(100% + 15px);
                    left: 0;
                    width: calc(100% + 110px); /* Adjust to span more width */
                    margin-left: -55px; /* Center it better considering the pill shape */
                    background: #233138;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
                    z-index: 1000;
                    overflow: hidden;
                    animation: slideUp 0.15s ease-out;
                }

                .suggestion-item {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    color: #e9edef;
                }

                .suggestion-item:last-child { border-bottom: none; }
                
                .suggestion-item.active { 
                    background: #2a3942;
                }

                .suggestion-label { 
                    font-weight: 700; 
                    min-width: 90px;
                    color: var(--primary); 
                    font-size: 0.9rem;
                }

                .suggestion-preview { 
                    font-size: 0.85rem; 
                    opacity: 0.7; 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                    color: #8696a0;
                }

                .suggestion-item[data-type="action"] {
                    color: var(--primary);
                    background: rgba(var(--primary-rgb), 0.05);
                }

                .suggestion-item[data-type="action"] .suggestion-label {
                    width: 100%;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .suggestion-item[data-type="action"] .suggestion-label::before {
                    content: '+';
                    font-size: 1.2rem;
                }

                .input-area textarea {
                    width: 100%;
                    background: transparent !important;
                    border: none !important;
                    padding: 10px 0; /* Reduced to fix the "too far down" issue */
                    color: #e9edef;
                    font-size: 15px;
                    line-height: 22px; /* Standard row height */
                    max-height: 120px;
                    resize: none;
                    outline: none;
                    font-family: inherit;
                    scrollbar-width: none;
                    margin: 0;
                    display: block;
                }

                .input-area textarea::placeholder {
                    color: #8696a0;
                }

                /* Unified rounded action buttons */
                .mic-btn, .emoji-trigger-btn, .send-btn-wa {
                    background: transparent;
                    border: none;
                    color: #8696a0;
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .mic-btn:hover, .emoji-trigger-btn:hover {
                    color: #e9edef;
                    background: rgba(255, 255, 255, 0.05);
                }

                .send-btn-wa {
                    color: var(--primary);
                }

                .send-btn-wa:hover {
                    transform: scale(1.1);
                    background: rgba(var(--primary-rgb), 0.1);
                }

                .emoji-picker-container {
                    position: relative;
                }

                .emoji-popup {
                    position: absolute;
                    bottom: calc(100% + 20px);
                    left: -10px;
                    background: #233138;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                    z-index: 1000;
                    width: 320px;
                    animation: emojiFadeIn 0.2s ease-out;
                }

                .emoji-popup::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 20px;
                    border-width: 8px;
                    border-style: solid;
                    border-color: #233138 transparent transparent transparent;
                }

                @keyframes emojiFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .emoji-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                }

                .emoji-select-btn {
                    background: transparent;
                    border: none;
                    font-size: 1.6rem;
                    aspect-ratio: 1;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.15s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .emoji-select-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    transform: scale(1.25);
                }

                .recording-overlay, .audio-preview-bar {
                    padding: 1rem 1.5rem;
                    display: flex; justify-content: space-between; align-items: center;
                    background: #202c33;
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-top: 1px solid rgba(255,255,255,0.05);
                }

                .recording-info, .preview-info { display: flex; align-items: center; gap: 12px; }
                .recording-dot { 
                    width: 10px; height: 10px; background: #ef4444; border-radius: 50%; 
                    animation: pulse 1s infinite;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                .recording-timer { font-family: 'Inter', monospace; font-size: 1.1rem; color: #e9edef; }

                .recording-actions, .preview-actions { display: flex; gap: 12px; }

                .record-btn-action {
                    width: 44px; height: 44px; border-radius: 50%; border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .record-btn-action.discard { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .record-btn-action.discard:hover { background: #ef4444; color: white; }
                .record-btn-action.pause { background: rgba(255, 255, 255, 0.05); color: #e9edef; }
                .record-btn-action.stop { background: var(--primary); color: black; }

                .audio-player { 
                    height: 35px; width: 220px; 
                    filter: invert(100%) hue-rotate(180deg) brightness(1.5);
                }
                .audio-message { padding: 4px 0; }

                .chat-image-content {
                    max-width: 250px;
                    max-height: 250px;
                    border-radius: 12px;
                    object-fit: cover;
                    display: block;
                    margin-bottom: 4px;
                    cursor: pointer;
                }
            `}</style>

            {
                showTemplateManager && (
                    <div className="template-modal-overlay" onClick={() => setShowTemplateManager(false)}>
                        <div className="template-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Gestão de Modelos</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>Use / para acessar rápido no chat</p>
                                </div>
                                <button className="close-btn" onClick={() => setShowTemplateManager(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                {/* Left Side: Form */}
                                <div className="template-form-section">
                                    <h4 className="section-title">{editingTemplate ? 'EDITAR MODELO' : 'NOVO MODELO'}</h4>

                                    <div className="form-group">
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Título (ex: saudacao)"
                                            value={templateForm.title}
                                            onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group" style={{ flex: 1 }}>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Conteúdo da mensagem..."
                                            value={templateForm.content}
                                            onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-footer">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={templateForm.is_public}
                                                onChange={e => setTemplateForm({ ...templateForm, is_public: e.target.checked })}
                                            />
                                            <span>Público para todos</span>
                                        </label>

                                        <div className="button-group">
                                            {editingTemplate && (
                                                <button className="btn btn-secondary" onClick={() => saveTemplate(true)}>
                                                    <Copy size={16} /> Duplicar
                                                </button>
                                            )}
                                            <button className="btn btn-primary" onClick={() => saveTemplate(false)}>
                                                <Save size={16} /> {editingTemplate ? 'Salvar' : 'Criar'}
                                            </button>
                                        </div>
                                    </div>

                                    {editingTemplate && (
                                        <button className="btn btn-danger" onClick={async () => {
                                            if (confirm('Excluir este modelo?')) {
                                                await supabase.from('internal_message_templates').delete().eq('id', editingTemplate.id);
                                                setEditingTemplate(null);
                                                setTemplateForm({ title: '', content: '', is_public: true });
                                                fetchTemplates();
                                            }
                                        }}>
                                            <Trash2 size={16} /> Excluir
                                        </button>
                                    )}
                                </div>

                                {/* Right Side: List */}
                                <div className="template-list-section">
                                    <div className="list-header">
                                        <h4 className="section-title">MODELOS SALVOS</h4>
                                        <button
                                            className="btn-icon-add"
                                            onClick={() => {
                                                setEditingTemplate(null);
                                                setTemplateForm({ title: '', content: '', is_public: true });
                                            }}
                                            title="Novo modelo"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    <div className="templates-scroll">
                                        {templates.length === 0 ? (
                                            <div className="empty-state">
                                                <p>Nenhum modelo criado ainda.</p>
                                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Crie seu primeiro modelo ao lado!</p>
                                            </div>
                                        ) : (
                                            templates.map(t => (
                                                <div
                                                    key={t.id}
                                                    className={`template-card ${editingTemplate?.id === t.id ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setEditingTemplate(t);
                                                        setTemplateForm({ title: t.title, content: t.content, is_public: t.is_public });
                                                    }}
                                                >
                                                    <div className="template-card-header">
                                                        <span className="template-card-title">/{t.title}</span>
                                                        {t.is_public ? <Globe size={14} /> : <Lock size={14} />}
                                                    </div>
                                                    <p className="template-card-content">{t.content}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                /* ===== TEMPLATE MODAL ===== */
                .template-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .template-modal {
                    background: #1a1a1a;
                    width: 1000px;
                    max-width: 95vw;
                    height: 700px;
                    max-height: 90vh;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.9);
                }

                .modal-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.02);
                    flex-shrink: 0;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: white;
                    opacity: 0.5;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    padding: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    opacity: 1;
                }

                /* Modal Body - Two Columns */
                .modal-body {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }

                /* Left Column: Form */
                .template-form-section {
                    width: 420px;
                    flex-shrink: 0;
                    padding: 2rem;
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                /* Right Column: List */
                .template-list-section {
                    flex: 1;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    overflow: hidden;
                }

                .section-title {
                    margin: 0;
                    font-size: 0.85rem;
                    color: var(--primary);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 800;
                }

                /* Form Elements */
                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-input,
                .form-textarea {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    padding: 1rem;
                    color: white;
                    font-family: inherit;
                    font-size: 1rem;
                    width: 100%;
                    transition: all 0.2s;
                }

                .form-input:focus,
                .form-textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                    background: rgba(0, 0, 0, 0.7);
                }

                .form-textarea {
                    resize: none;
                    height: 100%;
                    min-height: 250px;
                    line-height: 1.6;
                }

                .form-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.95rem;
                }

                .checkbox-label input[type="checkbox"] {
                    cursor: pointer;
                    width: 18px;
                    height: 18px;
                }

                .button-group {
                    display: flex;
                    gap: 0.75rem;
                }

                /* Buttons */
                .btn {
                    padding: 0.75rem 1.25rem;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-weight: 700;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .btn-primary {
                    background: var(--primary);
                    color: black;
                    box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.3);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.4);
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .btn-danger {
                    background: rgba(255, 68, 68, 0.15);
                    color: #ff4444;
                    border: 1px solid rgba(255, 68, 68, 0.3);
                    margin-top: 1rem;
                    align-self: flex-start;
                }

                .btn-danger:hover {
                    background: #ff4444;
                    color: white;
                }

                /* List Header */
                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .btn-icon-add {
                    background: rgba(var(--primary-rgb), 0.15);
                    border: 1px solid rgba(var(--primary-rgb), 0.3);
                    color: var(--primary);
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-icon-add:hover {
                    background: rgba(var(--primary-rgb), 0.25);
                    transform: scale(1.05);
                }

                /* Templates Scroll Area */
                .templates-scroll {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding-right: 0.5rem;
                }

                .templates-scroll::-webkit-scrollbar {
                    width: 6px;
                }

                .templates-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }

                .templates-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                }

                .templates-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                /* Empty State */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    opacity: 0.5;
                }

                .empty-state p {
                    margin: 0.5rem 0;
                }

                /* Template Card */
                .template-card {
                    padding: 1.25rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .template-card:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }

                .template-card.active {
                    background: rgba(var(--primary-rgb), 0.08);
                    border-color: var(--primary);
                }

                .template-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .template-card-title {
                    font-weight: 800;
                    font-size: 1rem;
                    color: var(--primary);
                }

                .template-card-content {
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: rgba(255, 255, 255, 0.7);
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div >
    );
};

export default ChatWindow;
