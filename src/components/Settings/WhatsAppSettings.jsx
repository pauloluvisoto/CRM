import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    MessageCircle, RefreshCw, QrCode, Phone, Wifi, WifiOff,
    Settings, Copy, Check, AlertCircle, Loader2, Smartphone,
    Bell, Link as LinkIcon, Trash2, Power, Save, Plus, ChevronRight,
    CheckCircle2, XCircle, Clock
} from 'lucide-react';
import {
    getQRCode,
    getPairingCode,
    getInstanceStatus,
    getInstanceData,
    getDeviceInfo,
    restartInstance,
    disconnectInstance,
    updateWebhook,
    setAutoRead,
    setAccountToken,
    getAccountToken,
    setActiveInstance,
    getActiveInstance,
    getWApiCredentials,
    createInstance,
    listInstances,
    deleteInstance
} from '../../services/wApi';

const WhatsAppSettings = () => {
    // Step State
    const [currentStep, setCurrentStep] = useState(1); // 1: Token, 2: Instance, 3: Connect, 4: Connected

    // Account Token State
    const [accountToken, setAccountTokenState] = useState('');
    const [isTokenSaved, setIsTokenSaved] = useState(false);

    // Instance State
    const [instances, setInstances] = useState([]);
    const [activeInstanceId, setActiveInstanceIdState] = useState('');
    const [activeInstanceToken, setActiveInstanceTokenState] = useState('');
    const [newInstanceName, setNewInstanceName] = useState('');
    const [isCreatingInstance, setIsCreatingInstance] = useState(false);

    // Connection State
    const [connectionStatus, setConnectionStatus] = useState('unknown');
    const [qrCode, setQrCode] = useState(null);
    const [pairingCode, setPairingCode] = useState(null);
    const [phoneForPairing, setPhoneForPairing] = useState('');
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [instanceData, setInstanceData] = useState(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('connection');
    const [copied, setCopied] = useState(false);

    // Webhook State
    const [webhooks, setWebhooks] = useState({
        received: '',
        delivery: '',
        connected: '',
        disconnected: '',
        'message-status': '',
        'chat-presence': ''
    });

    // Auto-read State
    const [autoRead, setAutoReadState] = useState(false);

    // QR Refresh interval
    const qrRefreshRef = useRef(null);

    // Initialize from localStorage
    useEffect(() => {
        const savedToken = getAccountToken();
        const { instanceId, instanceToken } = getActiveInstance();

        if (savedToken) {
            setAccountTokenState(savedToken);
            setIsTokenSaved(true);

            if (instanceId) {
                setActiveInstanceIdState(instanceId);
                setActiveInstanceTokenState(instanceToken || '');
                setCurrentStep(3); // Go to connect step

                // Check status
                checkInstanceStatus(instanceId);
            } else {
                setCurrentStep(2); // Go to instance selection
                loadInstances();
            }
        }
    }, []);

    // Load instances from API
    const loadInstances = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await listInstances(1, 50);
            setInstances(result.data || []);
        } catch (err) {
            console.error('Error loading instances:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Check instance connection status
    const checkInstanceStatus = async (instanceId) => {
        if (!instanceId) return;

        setLoading(true);
        try {
            const status = await getInstanceStatus(instanceId);

            if (status.connected) {
                setConnectionStatus('connected');
                setCurrentStep(4);
                setQrCode(null);
                setPairingCode(null);

                // Get device info
                try {
                    const device = await getDeviceInfo(instanceId);
                    setDeviceInfo(device);
                } catch (e) {
                    console.warn('Could not get device info:', e);
                }

                // Get instance data
                try {
                    const data = await getInstanceData(instanceId);
                    setInstanceData(data);
                    setAutoReadState(data.automaticReading || false);
                    setWebhooks({
                        received: data.webhookReceivedUrl || '',
                        delivery: data.webhookDeliveryUrl || '',
                        connected: data.webhookConnectedUrl || '',
                        disconnected: data.webhookDisconnectedUrl || '',
                        'message-status': data.webhookStatusUrl || '',
                        'chat-presence': data.webhookPresenceUrl || ''
                    });
                } catch (e) {
                    console.warn('Could not get instance data:', e);
                }
            } else {
                setConnectionStatus('disconnected');
                setDeviceInfo(null);
            }
        } catch (err) {
            console.error('Error checking status:', err);
            setConnectionStatus('unknown');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Save Account Token
    const handleSaveToken = () => {
        if (!accountToken.trim()) {
            setError('Digite o Token da conta');
            return;
        }
        setAccountToken(accountToken.trim());
        setIsTokenSaved(true);
        setCurrentStep(2);
        setSuccess('Token salvo com sucesso!');
        setTimeout(() => setSuccess(null), 2000);
        loadInstances();
    };

    // Step 2: Create Instance
    const handleCreateInstance = async () => {
        if (!newInstanceName.trim()) {
            setError('Digite um nome para a instância');
            return;
        }

        setIsCreatingInstance(true);
        setError(null);

        try {
            const result = await createInstance(newInstanceName.trim());

            if (result.instanceId) {
                setActiveInstanceIdState(result.instanceId);
                setActiveInstanceTokenState(result.token || '');
                setSuccess(`Instância criada! ID: ${result.instanceId}`);
                setCurrentStep(3);
                setNewInstanceName('');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsCreatingInstance(false);
        }
    };

    // Step 2: Select existing instance
    const handleSelectInstance = (instance) => {
        setActiveInstance(instance.instanceId, instance.token);
        setActiveInstanceIdState(instance.instanceId);
        setActiveInstanceTokenState(instance.token || '');

        if (instance.connected) {
            setConnectionStatus('connected');
            setCurrentStep(4);
            checkInstanceStatus(instance.instanceId);
        } else {
            setConnectionStatus('disconnected');
            setCurrentStep(3);
        }
    };

    // Step 3: Get QR Code
    const handleGetQRCode = async () => {
        setLoading(true);
        setError(null);
        setQrCode(null);
        setPairingCode(null);

        try {
            const result = await getQRCode(activeInstanceId);
            if (result.qrcode) {
                setQrCode(result.qrcode);

                // Start polling for connection status
                startQRPolling();
            } else if (result.message) {
                // Instance might already be connected
                await checkInstanceStatus(activeInstanceId);
            }
        } catch (err) {
            // Check if it's an initialization error (no IP/port)
            if (err.message && (err.message.includes('IP') || err.message.includes('porta') || err.message.includes('configurad') || err.message.includes('associado'))) {
                // This usually means the instance is PENDING or needs activation
                setError(
                    '⚠️ Instância sem recursos alocados. ' +
                    'Isso pode acontecer se a instância está com status PENDING ou TRIAL e precisa ser ativada no painel da W-API. ' +
                    'Verifique se há pagamento pendente ou se a instância precisa ser ativada manualmente no site da W-API.'
                );
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Start polling to check if connected after scanning QR
    const startQRPolling = () => {
        // Clear any existing interval
        if (qrRefreshRef.current) {
            clearInterval(qrRefreshRef.current);
        }

        let attempts = 0;
        qrRefreshRef.current = setInterval(async () => {
            attempts++;

            if (attempts > 60) { // Stop after 2 minutes
                clearInterval(qrRefreshRef.current);
                setQrCode(null);
                setError('Tempo esgotado. Gere um novo QR Code.');
                return;
            }

            try {
                const status = await getInstanceStatus(activeInstanceId);
                if (status.connected) {
                    clearInterval(qrRefreshRef.current);
                    setConnectionStatus('connected');
                    setCurrentStep(4);
                    setQrCode(null);
                    setSuccess('WhatsApp conectado com sucesso! 🎉');
                    setTimeout(() => setSuccess(null), 3000);
                    await checkInstanceStatus(activeInstanceId);
                }
            } catch (e) {
                console.warn('Polling error:', e);
            }
        }, 2000); // Check every 2 seconds
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (qrRefreshRef.current) {
                clearInterval(qrRefreshRef.current);
            }
        };
    }, []);

    // Step 3: Get Pairing Code
    const handleGetPairingCode = async () => {
        if (!phoneForPairing.trim()) {
            setError('Digite o número do telefone');
            return;
        }

        setLoading(true);
        setError(null);
        setPairingCode(null);
        setQrCode(null);

        try {
            const result = await getPairingCode(phoneForPairing.trim(), activeInstanceId);
            if (result.pairingCode) {
                setPairingCode(result.pairingCode);
                startQRPolling(); // Also poll when using pairing code
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Connected actions
    const handleDisconnect = async () => {
        if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;

        setLoading(true);
        setError(null);

        try {
            await disconnectInstance(activeInstanceId);
            setConnectionStatus('disconnected');
            setDeviceInfo(null);
            setCurrentStep(3);
            setSuccess('Desconectado com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestart = async () => {
        setLoading(true);
        setError(null);

        try {
            await restartInstance(activeInstanceId);
            setSuccess('Instância reiniciada!');
            setTimeout(() => {
                setSuccess(null);
                checkInstanceStatus(activeInstanceId);
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInstance = async (instanceId) => {
        if (!window.confirm('Tem certeza que deseja DELETAR esta instância? Esta ação não pode ser desfeita.')) return;

        setLoading(true);
        setError(null);

        try {
            await deleteInstance(instanceId);
            setSuccess('Instância deletada!');

            // If it was the active instance, go back to step 2
            if (instanceId === activeInstanceId) {
                setActiveInstanceIdState('');
                setActiveInstanceTokenState('');
                setConnectionStatus('unknown');
                setCurrentStep(2);
            }

            loadInstances();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWebhook = async (type) => {
        setLoading(true);
        setError(null);

        try {
            await updateWebhook(type, webhooks[type], activeInstanceId);
            setSuccess(`Webhook ${type} atualizado!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoReadToggle = async () => {
        setLoading(true);
        setError(null);

        try {
            await setAutoRead(!autoRead, activeInstanceId);
            setAutoReadState(!autoRead);
            setSuccess(`Leitura automática ${!autoRead ? 'ativada' : 'desativada'}!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        if (!window.confirm('Isso vai limpar todas as credenciais salvas. Continuar?')) return;

        localStorage.removeItem('wapi_account_token');
        localStorage.removeItem('wapi_instance_id');
        localStorage.removeItem('wapi_instance_token');
        setAccountTokenState('');
        setIsTokenSaved(false);
        setActiveInstanceIdState('');
        setActiveInstanceTokenState('');
        setInstances([]);
        setConnectionStatus('unknown');
        setCurrentStep(1);
    };

    // Status Badge Component
    const StatusBadge = ({ status }) => {
        const config = {
            connected: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', text: 'Conectado', icon: Wifi },
            disconnected: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: 'Desconectado', icon: WifiOff },
            connecting: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', text: 'Conectando...', icon: Loader2 },
            unknown: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.15)', text: 'Desconhecido', icon: AlertCircle }
        };
        const { color, bg, text, icon: Icon } = config[status] || config.unknown;

        return (
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '20px',
                background: bg, color, fontWeight: 600, fontSize: '14px'
            }}>
                <Icon size={16} className={status === 'connecting' ? 'animate-spin' : ''} />
                {text}
            </div>
        );
    };

    // Step Indicator
    const StepIndicator = () => (
        <div className="wa-steps">
            {[
                { num: 1, label: 'Token' },
                { num: 2, label: 'Instância' },
                { num: 3, label: 'Conexão' },
                { num: 4, label: 'Pronto' }
            ].map((step, idx) => (
                <React.Fragment key={step.num}>
                    <div
                        className={`wa-step ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}
                        onClick={() => {
                            if (step.num <= currentStep) {
                                if (step.num === 1) handleReset();
                                else if (step.num === 2 && isTokenSaved) setCurrentStep(2);
                                else if (step.num === 3 && activeInstanceId) setCurrentStep(3);
                            }
                        }}
                    >
                        <div className="wa-step-circle">
                            {currentStep > step.num ? <Check size={14} /> : step.num}
                        </div>
                        <span className="wa-step-label">{step.label}</span>
                    </div>
                    {idx < 3 && <div className={`wa-step-line ${currentStep > step.num ? 'active' : ''}`} />}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="whatsapp-settings">
            <style>{`
                .whatsapp-settings {
                    background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 1.75rem;
                    margin-bottom: 2rem;
                    backdrop-filter: blur(10px);
                }

                .wa-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .wa-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #25D366;
                }

                .wa-steps {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0;
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                }

                .wa-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    opacity: 0.4;
                    transition: all 0.3s;
                }

                .wa-step.active {
                    opacity: 1;
                }

                .wa-step.current .wa-step-circle {
                    background: #25D366;
                    color: white;
                    box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.2);
                }

                .wa-step-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                    color: var(--text-secondary);
                    transition: all 0.3s;
                }

                .wa-step.active .wa-step-circle {
                    background: rgba(37, 211, 102, 0.3);
                    color: #25D366;
                }

                .wa-step-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .wa-step-line {
                    width: 60px;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 0 8px;
                    margin-bottom: 20px;
                    transition: all 0.3s;
                }

                .wa-step-line.active {
                    background: #25D366;
                }

                .wa-section {
                    margin-bottom: 1.5rem;
                }

                .wa-section-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    margin-bottom: 12px;
                    letter-spacing: 0.5px;
                }

                .wa-input-group {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .wa-input {
                    flex: 1;
                    padding: 14px 18px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: var(--text-primary);
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .wa-input:focus {
                    outline: none;
                    border-color: #25D366;
                    background: rgba(37, 211, 102, 0.05);
                }

                .wa-input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }

                .wa-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 24px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    font-size: 14px;
                }

                .wa-btn-primary {
                    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                    color: white;
                }

                .wa-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
                }

                .wa-btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .wa-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .wa-btn-danger {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .wa-btn-danger:hover {
                    background: rgba(239, 68, 68, 0.25);
                }

                .wa-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .wa-qr-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 32px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 16px;
                    border: 2px dashed rgba(255, 255, 255, 0.1);
                }

                .wa-qr-image {
                    width: 280px;
                    height: 280px;
                    border-radius: 16px;
                    background: white;
                    padding: 16px;
                }

                .wa-pairing-code {
                    font-size: 2.5rem;
                    font-weight: 700;
                    font-family: monospace;
                    letter-spacing: 6px;
                    color: #25D366;
                    background: rgba(37, 211, 102, 0.1);
                    padding: 20px 40px;
                    border-radius: 16px;
                    border: 2px dashed #25D366;
                }

                .wa-device-card {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 24px;
                    background: linear-gradient(135deg, rgba(37, 211, 102, 0.15) 0%, rgba(18, 140, 126, 0.15) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(37, 211, 102, 0.3);
                }

                .wa-device-avatar {
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid #25D366;
                }

                .wa-device-info h4 {
                    margin: 0 0 4px;
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .wa-device-info p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 14px;
                }

                .wa-alert {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    border-radius: 10px;
                    margin-bottom: 16px;
                    font-size: 14px;
                }

                .wa-alert-error {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                }

                .wa-alert-success {
                    background: rgba(34, 197, 94, 0.15);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    color: #86efac;
                }

                .wa-instance-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 16px;
                }

                .wa-instance-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .wa-instance-card:hover {
                    background: rgba(37, 211, 102, 0.1);
                    border-color: rgba(37, 211, 102, 0.3);
                }

                .wa-instance-card.active {
                    background: rgba(37, 211, 102, 0.15);
                    border-color: #25D366;
                }

                .wa-instance-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .wa-instance-status {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .wa-instance-status.connected {
                    background: #22c55e;
                    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
                }

                .wa-instance-status.disconnected {
                    background: #71717a;
                }

                .wa-instance-name {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .wa-instance-id {
                    font-size: 12px;
                    color: var(--text-secondary);
                    font-family: monospace;
                }

                .wa-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 1.5rem;
                }

                .wa-tab {
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.2);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                }

                .wa-tab:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .wa-tab.active {
                    background: rgba(37, 211, 102, 0.15);
                    border-color: #25D366;
                    color: #25D366;
                }

                .wa-webhook-row {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .wa-webhook-label {
                    width: 140px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    font-size: 14px;
                }

                .wa-toggle {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .wa-toggle-switch {
                    position: relative;
                    width: 52px;
                    height: 28px;
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .wa-toggle-switch.active {
                    background: #25D366;
                }

                .wa-toggle-thumb {
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    width: 22px;
                    height: 22px;
                    background: white;
                    border-radius: 50%;
                    transition: all 0.3s;
                }

                .wa-toggle-switch.active .wa-toggle-thumb {
                    transform: translateX(24px);
                }

                .wa-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-top: 16px;
                }

                .wa-help-text {
                    color: var(--text-secondary);
                    font-size: 13px;
                    margin-top: 8px;
                    line-height: 1.5;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse {
                    animation: pulse 2s ease-in-out infinite;
                }
            `}</style>

            <div className="wa-header">
                <div className="wa-title">
                    <MessageCircle size={28} />
                    WhatsApp Business API (W-API)
                </div>
                {currentStep === 4 && <StatusBadge status={connectionStatus} />}
            </div>

            {/* Step Indicator */}
            <StepIndicator />

            {/* Error/Success Messages */}
            {error && (
                <div className="wa-alert wa-alert-error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
            {success && (
                <div className="wa-alert wa-alert-success">
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            {/* STEP 1: Account Token */}
            {currentStep === 1 && (
                <div className="wa-section">
                    <div className="wa-section-title">1. Token da Conta W-API</div>
                    <p className="wa-help-text" style={{ marginBottom: '16px' }}>
                        Cole aqui o token JWT da sua conta W-API. Você encontra esse token no painel da W-API ou ao criar sua conta.
                    </p>
                    <div className="wa-input-group">
                        <input
                            type="password"
                            className="wa-input"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={accountToken}
                            onChange={(e) => setAccountTokenState(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                        />
                        <button className="wa-btn wa-btn-primary" onClick={handleSaveToken}>
                            <ChevronRight size={18} />
                            Continuar
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: Instance Selection/Creation */}
            {currentStep === 2 && (
                <>
                    <div className="wa-section">
                        <div className="wa-section-title">2. Criar Nova Instância</div>
                        <p className="wa-help-text" style={{ marginBottom: '16px' }}>
                            Cada instância representa um número de WhatsApp conectado.
                        </p>
                        <div className="wa-input-group">
                            <input
                                type="text"
                                className="wa-input"
                                placeholder="Nome da instância (ex: Atendimento Principal)"
                                value={newInstanceName}
                                onChange={(e) => setNewInstanceName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateInstance()}
                            />
                            <button
                                className="wa-btn wa-btn-primary"
                                onClick={handleCreateInstance}
                                disabled={isCreatingInstance}
                            >
                                {isCreatingInstance ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Plus size={18} />
                                )}
                                Criar Instância
                            </button>
                        </div>
                    </div>

                    {instances.length > 0 && (
                        <div className="wa-section">
                            <div className="wa-section-title">Ou selecione uma instância existente</div>
                            <div className="wa-instance-list">
                                {instances.map((inst) => (
                                    <div
                                        key={inst.instanceId}
                                        className={`wa-instance-card ${inst.instanceId === activeInstanceId ? 'active' : ''}`}
                                        onClick={() => handleSelectInstance(inst)}
                                    >
                                        <div className="wa-instance-info">
                                            <div className={`wa-instance-status ${inst.connected ? 'connected' : 'disconnected'}`} />
                                            <div>
                                                <div className="wa-instance-name">{inst.instanceName || 'Instância'}</div>
                                                <div className="wa-instance-id">{inst.instanceId}</div>
                                                {inst.connectedPhone && (
                                                    <div style={{ fontSize: '12px', color: '#25D366', marginTop: '4px' }}>
                                                        📱 {inst.connectedPhone}
                                                    </div>
                                                )}
                                                {/* Show payment/trial status */}
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                    {inst.isTrial && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            padding: '2px 8px',
                                                            background: 'rgba(234, 179, 8, 0.2)',
                                                            color: '#eab308',
                                                            borderRadius: '4px',
                                                            fontWeight: 600
                                                        }}>
                                                            TRIAL
                                                        </span>
                                                    )}
                                                    {inst.paymentStatus && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            padding: '2px 8px',
                                                            background: inst.paymentStatus === 'PAID' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                            color: inst.paymentStatus === 'PAID' ? '#22c55e' : '#ef4444',
                                                            borderRadius: '4px',
                                                            fontWeight: 600
                                                        }}>
                                                            {inst.paymentStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="wa-btn wa-btn-danger"
                                                style={{ padding: '8px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteInstance(inst.instanceId);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <ChevronRight size={20} color="var(--text-secondary)" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="wa-actions">
                        <button className="wa-btn wa-btn-secondary" onClick={loadInstances} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Atualizar Lista
                        </button>
                    </div>
                </>
            )}

            {/* STEP 3: Connection (QR Code / Pairing) */}
            {currentStep === 3 && (
                <>
                    <div className="wa-section">
                        <div style={{
                            padding: '16px',
                            background: 'rgba(37, 211, 102, 0.1)',
                            borderRadius: '12px',
                            marginBottom: '24px',
                            border: '1px solid rgba(37, 211, 102, 0.2)'
                        }}>
                            <strong style={{ color: '#25D366' }}>Instância Ativa:</strong>{' '}
                            <span style={{ fontFamily: 'monospace' }}>{activeInstanceId}</span>
                        </div>
                    </div>

                    <div className="wa-section">
                        <div className="wa-section-title">3. Conectar via QR Code</div>
                        <div className="wa-qr-container">
                            {qrCode ? (
                                <>
                                    <img src={qrCode} alt="QR Code" className="wa-qr-image" />
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
                                        Abra o WhatsApp &gt; <strong>Dispositivos Conectados</strong> &gt; <strong>Conectar Dispositivo</strong>
                                        <br />Escaneie este QR Code com seu celular
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308' }} className="animate-pulse">
                                        <Clock size={16} />
                                        <span>Aguardando leitura do QR Code...</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <QrCode size={80} color="rgba(255,255,255,0.15)" />
                                    <p style={{ color: 'var(--text-secondary)' }}>Clique para gerar o QR Code de conexão</p>
                                </>
                            )}
                            <button className="wa-btn wa-btn-primary" onClick={handleGetQRCode} disabled={loading}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                                {qrCode ? 'Atualizar QR Code' : 'Gerar QR Code'}
                            </button>
                        </div>
                    </div>

                    <div className="wa-section" style={{ marginTop: '24px' }}>
                        <div className="wa-section-title">Ou conectar via Código de Pareamento</div>
                        <p className="wa-help-text" style={{ marginBottom: '16px' }}>
                            Use esta opção se preferir conectar digitando um código no WhatsApp.
                        </p>
                        <div className="wa-input-group">
                            <input
                                type="text"
                                className="wa-input"
                                placeholder="Número com DDI (Ex: 5511999999999)"
                                value={phoneForPairing}
                                onChange={(e) => setPhoneForPairing(e.target.value)}
                            />
                            <button className="wa-btn wa-btn-primary" onClick={handleGetPairingCode} disabled={loading}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                                Gerar Código
                            </button>
                        </div>

                        {pairingCode && (
                            <div className="wa-qr-container" style={{ marginTop: '16px' }}>
                                <div className="wa-pairing-code">{pairingCode}</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
                                    WhatsApp &gt; Dispositivos Conectados &gt; <strong>Conectar com número</strong><br />
                                    Digite este código quando solicitado
                                </p>
                                <button className="wa-btn wa-btn-secondary" onClick={() => copyToClipboard(pairingCode)}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copiado!' : 'Copiar Código'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="wa-actions">
                        <button className="wa-btn wa-btn-secondary" onClick={() => setCurrentStep(2)}>
                            Voltar para Instâncias
                        </button>
                        <button className="wa-btn wa-btn-secondary" onClick={handleRestart} disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                            Reiniciar Instância
                        </button>
                    </div>
                </>
            )}

            {/* STEP 4: Connected - Full Management */}
            {currentStep === 4 && (
                <>
                    {/* Tabs */}
                    <div className="wa-tabs">
                        <button
                            className={`wa-tab ${activeTab === 'connection' ? 'active' : ''}`}
                            onClick={() => setActiveTab('connection')}
                        >
                            <Wifi size={16} style={{ marginRight: 8 }} />
                            Conexão
                        </button>
                        <button
                            className={`wa-tab ${activeTab === 'webhooks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('webhooks')}
                        >
                            <LinkIcon size={16} style={{ marginRight: 8 }} />
                            Webhooks
                        </button>
                        <button
                            className={`wa-tab ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={16} style={{ marginRight: 8 }} />
                            Configurações
                        </button>
                    </div>

                    {/* CONNECTION TAB */}
                    {activeTab === 'connection' && (
                        <>
                            <div className="wa-section">
                                <div className="wa-section-title">Dispositivo Conectado</div>
                                <div className="wa-device-card">
                                    {deviceInfo?.profilePictureUrl ? (
                                        <img src={deviceInfo.profilePictureUrl} alt="" className="wa-device-avatar" />
                                    ) : (
                                        <div className="wa-device-avatar" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Smartphone size={28} color="white" />
                                        </div>
                                    )}
                                    <div className="wa-device-info">
                                        <h4>{deviceInfo?.name || instanceData?.instanceName || 'WhatsApp Business'}</h4>
                                        <p style={{ color: '#25D366', fontWeight: 600 }}>
                                            +{deviceInfo?.connectedPhone || instanceData?.connectedPhone || 'Conectado'}
                                        </p>
                                        <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                                            Instance ID: {activeInstanceId}
                                        </p>
                                    </div>
                                </div>

                                <div className="wa-actions">
                                    <button className="wa-btn wa-btn-secondary" onClick={() => checkInstanceStatus(activeInstanceId)} disabled={loading}>
                                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                        Atualizar
                                    </button>
                                    <button className="wa-btn wa-btn-secondary" onClick={handleRestart} disabled={loading}>
                                        <Power size={16} />
                                        Reiniciar
                                    </button>
                                    <button className="wa-btn wa-btn-danger" onClick={handleDisconnect} disabled={loading}>
                                        <WifiOff size={16} />
                                        Desconectar
                                    </button>
                                </div>
                            </div>

                            {instanceData && (
                                <div className="wa-section" style={{ marginTop: '24px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                    <div className="wa-section-title">Estatísticas</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
                                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(37, 211, 102, 0.1)', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#25D366' }}>{instanceData.messagesSent || 0}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Msgs Enviadas</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{instanceData.messagesReceived || 0}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Msgs Recebidas</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a855f7' }}>{instanceData.contacts || 0}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Contatos</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* WEBHOOKS TAB */}
                    {activeTab === 'webhooks' && (
                        <div className="wa-section">
                            <div className="wa-section-title">URLs de Webhook</div>
                            <p className="wa-help-text" style={{ marginBottom: '16px' }}>
                                Configure os endpoints para receber notificações de mensagens e eventos.
                            </p>

                            {Object.entries(webhooks).map(([key, value]) => (
                                <div className="wa-webhook-row" key={key}>
                                    <span className="wa-webhook-label">{
                                        key === 'received' ? 'Msg Recebida' :
                                            key === 'delivery' ? 'Msg Enviada' :
                                                key === 'connected' ? 'Conectado' :
                                                    key === 'disconnected' ? 'Desconectado' :
                                                        key === 'message-status' ? 'Status Msg' :
                                                            'Presença'
                                    }</span>
                                    <input
                                        type="url"
                                        className="wa-input"
                                        placeholder="https://seu-servidor.com/webhook"
                                        value={value}
                                        onChange={(e) => setWebhooks(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                    <button
                                        className="wa-btn wa-btn-secondary"
                                        onClick={() => handleSaveWebhook(key)}
                                        disabled={loading}
                                        style={{ padding: '14px' }}
                                    >
                                        <Save size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <>
                            <div className="wa-section">
                                <div className="wa-section-title">Preferências</div>

                                <div className="wa-toggle">
                                    <div>
                                        <strong>Leitura Automática</strong>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            Marcar mensagens como lidas automaticamente
                                        </p>
                                    </div>
                                    <div
                                        className={`wa-toggle-switch ${autoRead ? 'active' : ''}`}
                                        onClick={handleAutoReadToggle}
                                    >
                                        <div className="wa-toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="wa-section">
                                <div className="wa-section-title">Gerenciamento</div>
                                <div className="wa-actions">
                                    <button className="wa-btn wa-btn-secondary" onClick={() => setCurrentStep(2)}>
                                        <Plus size={16} />
                                        Gerenciar Instâncias
                                    </button>
                                    <button className="wa-btn wa-btn-danger" onClick={handleReset}>
                                        <Trash2 size={16} />
                                        Limpar Tudo
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default WhatsAppSettings;
