// WebSocketHandler.js - Enhanced for General Purpose Applications
const WebSocket = require('ws');
const crypto = require('crypto');
const EventEmitter = require('events');

class WebSocketHandler extends EventEmitter {
    constructor(config, dbInstance, windowInstance) {
        super();
        
        this.config = {
            port: 8080,
            host: '0.0.0.0',
            enableAuthentication: false,
            authToken: null,
            dbTableName: 'sensors_data',
            requiredFields: [],
            fieldsToEncrypt: [],
            enableHeartbeat: true,
            heartbeatInterval: 30000, // 30 seconds
            maxConnections: 100, // Increased for general apps
            enableDataValidation: true,
            logLevel: 'info',
            
            // New general-purpose features
            enableRequestResponse: true, // Enable request-response pattern
            enablePubSub: true, // Enable publish-subscribe pattern
            enableRPC: true, // Enable remote procedure calls
            enableStreaming: true, // Enable data streaming
            requestTimeout: 10000, // Request timeout in ms
            maxPayloadSize: 10 * 1024 * 1024, // 10MB for larger payloads
            enableCompression: true, // Enable message compression
            enableBinaryData: true, // Support binary data
            clientTypes: ['microcontroller', 'application', 'service'], // Supported client types
            
            ...config
        };

        this.db = dbInstance;
        this.mainWindow = windowInstance;
        this.server = null;
        this.clients = new Map();
        this.isRunning = false;
        this.connectionCount = 0;
        
        // New features for general applications
        this.pendingRequests = new Map(); // For request-response pattern
        this.subscriptions = new Map(); // For pub-sub pattern
        this.rpcMethods = new Map(); // For RPC methods
        this.streams = new Map(); // For streaming data
        
        // Generate auth token if authentication is enabled but no token provided
        if (this.config.enableAuthentication && !this.config.authToken) {
            this.config.authToken = this._generateAuthToken();
        }
        
        this._setupRPCMethods();
    }

    // Start WebSocket server
    async start() {
        if (this.isRunning) {
            this._log('warn', 'WebSocket server is already running');
            return;
        }

        try {
            const serverOptions = {
                port: this.config.port,
                host: this.config.host,
                maxPayload: this.config.maxPayloadSize,
            };

            // Enable compression if configured
            if (this.config.enableCompression) {
                serverOptions.perMessageDeflate = {
                    zlibDeflateOptions: {
                        level: 6,
                        concurrencyLimit: 10,
                    },
                    threshold: 1024,
                };
            }

            this.server = new WebSocket.Server(serverOptions);
            this._setupServerEventHandlers();
            this.isRunning = true;
            
            this._log('info', `Enhanced WebSocket server started on ws://${this.config.host}:${this.config.port}`);
            this._log('info', `Features: RPC=${this.config.enableRPC}, PubSub=${this.config.enablePubSub}, Streaming=${this.config.enableStreaming}`);
            
            if (this.config.enableAuthentication) {
                this._log('info', `Authentication enabled. Token: ${this.config.authToken}`);
            }

            this._sendToRenderer('websocket-server-status', {
                status: 'started',
                port: this.config.port,
                host: this.config.host,
                authEnabled: this.config.enableAuthentication,
                authToken: this.config.enableAuthentication ? this.config.authToken : null,
                features: {
                    requestResponse: this.config.enableRequestResponse,
                    pubSub: this.config.enablePubSub,
                    rpc: this.config.enableRPC,
                    streaming: this.config.enableStreaming
                },
                timestamp: new Date().toISOString()
            });

            this.emit('server-started', { port: this.config.port, host: this.config.host });

        } catch (error) {
            this._log('error', `Failed to start WebSocket server: ${error.message}`);
            this.emit('server-error', error);
            this._sendToRenderer('websocket-server-error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    // Stop WebSocket server
    async stop() {
        if (!this.isRunning) {
            this._log('warn', 'WebSocket server is not running');
            return;
        }

        try {
            // Clean up pending requests
            this.pendingRequests.forEach((request, requestId) => {
                if (request.timeout) {
                    clearTimeout(request.timeout);
                }
            });
            this.pendingRequests.clear();
            
            // Clean up streams
            this.streams.clear();
            
            // Clean up subscriptions
            this.subscriptions.clear();

            // Close all client connections
            this.clients.forEach((clientData, ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close(1000, 'Server shutdown');
                }
            });
            this.clients.clear();

            // Close server
            if (this.server) {
                this.server.close(() => {
                    this._log('info', 'WebSocket server stopped');
                });
            }

            this.isRunning = false;
            this.connectionCount = 0;

            this._sendToRenderer('websocket-server-status', {
                status: 'stopped',
                timestamp: new Date().toISOString()
            });

            this.emit('server-stopped');

        } catch (error) {
            this._log('error', `Error stopping WebSocket server: ${error.message}`);
            throw error;
        }
    }

    // Setup server event handlers
    _setupServerEventHandlers() {
        this.server.on('connection', (ws, request) => {
            this._handleNewConnection(ws, request);
        });

        this.server.on('error', (error) => {
            this._log('error', `WebSocket server error: ${error.message}`);
            this.emit('server-error', error);
            this._sendToRenderer('websocket-server-error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });

        this.server.on('listening', () => {
            this._log('info', `WebSocket server listening on port ${this.config.port}`);
        });
    }

    // Handle new client connection
    _handleNewConnection(ws, request) {
        const clientIP = request.socket.remoteAddress;
        const userAgent = request.headers['user-agent'] || 'Unknown';
        const clientId = this._generateClientId();

        this._log('info', `New connection from ${clientIP} (${userAgent})`);

        // Check max connections
        if (this.connectionCount >= this.config.maxConnections) {
            this._log('warn', `Max connections (${this.config.maxConnections}) reached, rejecting connection`);
            ws.close(1013, 'Server overloaded');
            return;
        }

        // Store client data
        const clientData = {
            id: clientId,
            ip: clientIP,
            userAgent: userAgent,
            connectedAt: new Date(),
            lastHeartbeat: new Date(),
            isAuthenticated: !this.config.enableAuthentication,
            dataReceived: 0,
            lastDataTime: null,
            clientType: 'unknown', // Will be set during handshake
            subscriptions: new Set(),
            capabilities: new Set()
        };

        this.clients.set(ws, clientData);
        this.connectionCount++;

        // Setup client event handlers
        this._setupClientEventHandlers(ws, clientData);

        // Start heartbeat if enabled
        if (this.config.enableHeartbeat) {
            this._startClientHeartbeat(ws, clientData);
        }

        // Send welcome message with capabilities
        this._sendToClient(ws, {
            type: 'welcome',
            clientId: clientId,
            authRequired: this.config.enableAuthentication,
            serverCapabilities: {
                requestResponse: this.config.enableRequestResponse,
                pubSub: this.config.enablePubSub,
                rpc: this.config.enableRPC,
                streaming: this.config.enableStreaming,
                binaryData: this.config.enableBinaryData,
                compression: this.config.enableCompression
            },
            supportedClientTypes: this.config.clientTypes,
            timestamp: new Date().toISOString()
        });

        this._sendToRenderer('websocket-client-connected', {
            clientId: clientId,
            ip: clientIP,
            userAgent: userAgent,
            totalConnections: this.connectionCount,
            timestamp: new Date().toISOString()
        });

        this.emit('client-connected', { clientId, ip: clientIP, userAgent });
    }

    // Setup client-specific event handlers
    _setupClientEventHandlers(ws, clientData) {
        ws.on('message', (rawData) => {
            this._handleClientMessage(ws, clientData, rawData);
        });

        ws.on('close', (code, reason) => {
            this._handleClientDisconnection(ws, clientData, code, reason);
        });

        ws.on('error', (error) => {
            this._log('error', `Client ${clientData.id} error: ${error.message}`);
            this.emit('client-error', { clientId: clientData.id, error });
            this._sendToRenderer('websocket-client-error', {
                clientId: clientData.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });

        ws.on('pong', () => {
            clientData.lastHeartbeat = new Date();
            this._log('debug', `Heartbeat received from client ${clientData.id}`);
        });
    }

    // Handle incoming messages from clients
    _handleClientMessage(ws, clientData, rawData) {
        try {
            let message;
            
            // Handle binary data if enabled
            if (this.config.enableBinaryData && rawData instanceof Buffer) {
                // Try to parse as JSON first, otherwise treat as binary
                try {
                    message = JSON.parse(rawData.toString());
                } catch {
                    this._handleBinaryMessage(ws, clientData, rawData);
                    return;
                }
            } else {
                message = JSON.parse(rawData.toString());
            }

            this._log('debug', `Message from ${clientData.id}:`, message);

            clientData.lastDataTime = new Date();
            clientData.dataReceived++;

            // Handle different message types
            switch (message.type) {
                case 'handshake':
                    this._handleHandshake(ws, clientData, message);
                    break;
                    
                case 'auth':
                    this._handleAuthentication(ws, clientData, message);
                    break;
                    
                case 'sensor_data': // Legacy microcontroller support
                    this._handleSensorData(ws, clientData, message);
                    break;
                    
                case 'data': // General data message
                    this._handleDataMessage(ws, clientData, message);
                    break;
                    
                case 'request':
                    this._handleRequest(ws, clientData, message);
                    break;
                    
                case 'response':
                    this._handleResponse(ws, clientData, message);
                    break;
                    
                case 'subscribe':
                    this._handleSubscribe(ws, clientData, message);
                    break;
                    
                case 'unsubscribe':
                    this._handleUnsubscribe(ws, clientData, message);
                    break;
                    
                case 'publish':
                    this._handlePublish(ws, clientData, message);
                    break;
                    
                case 'rpc_call':
                    this._handleRPCCall(ws, clientData, message);
                    break;
                    
                case 'stream_start':
                    this._handleStreamStart(ws, clientData, message);
                    break;
                    
                case 'stream_data':
                    this._handleStreamData(ws, clientData, message);
                    break;
                    
                case 'stream_end':
                    this._handleStreamEnd(ws, clientData, message);
                    break;
                    
                case 'heartbeat':
                    this._handleHeartbeat(ws, clientData, message);
                    break;
                    
                case 'ping':
                    this._sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                    
                default:
                    this._log('warn', `Unknown message type from ${clientData.id}: ${message.type}`);
                    this._sendToClient(ws, {
                        type: 'error',
                        message: `Unknown message type: ${message.type}`,
                        timestamp: new Date().toISOString()
                    });
            }

        } catch (error) {
            this._log('error', `Error parsing message from ${clientData.id}: ${error.message}`);
            this._sendToClient(ws, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Handle client handshake
    _handleHandshake(ws, clientData, message) {
        const { clientType, capabilities, version } = message;
        
        if (clientType && this.config.clientTypes.includes(clientType)) {
            clientData.clientType = clientType;
            this._log('info', `Client ${clientData.id} identified as ${clientType}`);
        }
        
        if (capabilities && Array.isArray(capabilities)) {
            capabilities.forEach(cap => clientData.capabilities.add(cap));
        }
        
        this._sendToClient(ws, {
            type: 'handshake_response',
            success: true,
            clientId: clientData.id,
            serverVersion: '2.0.0',
            timestamp: new Date().toISOString()
        });

        this.emit('client-handshake', { 
            clientId: clientData.id, 
            clientType, 
            capabilities 
        });
    }

    // Handle authentication (existing method)
    _handleAuthentication(ws, clientData, message) {
        if (!this.config.enableAuthentication) {
            this._sendToClient(ws, {
                type: 'auth_response',
                success: true,
                message: 'Authentication not required',
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (message.token === this.config.authToken) {
            clientData.isAuthenticated = true;
            this._log('info', `Client ${clientData.id} authenticated successfully`);
            
            this._sendToClient(ws, {
                type: 'auth_response',
                success: true,
                message: 'Authentication successful',
                timestamp: new Date().toISOString()
            });

            this._sendToRenderer('websocket-client-authenticated', {
                clientId: clientData.id,
                ip: clientData.ip,
                timestamp: new Date().toISOString()
            });

            this.emit('client-authenticated', { clientId: clientData.id });
        } else {
            this._log('warn', `Authentication failed for client ${clientData.id}`);
            
            this._sendToClient(ws, {
                type: 'auth_response',
                success: false,
                message: 'Invalid authentication token',
                timestamp: new Date().toISOString()
            });
            
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close(1008, 'Authentication failed');
                }
            }, 1000);
        }
    }

    // Handle sensor data (legacy support for microcontrollers)
    _handleSensorData(ws, clientData, message) {
        // This maintains backward compatibility
        this._handleDataMessage(ws, clientData, {
            ...message,
            type: 'data',
            dataType: 'sensor'
        });
    }

    // Handle general data messages
    _handleDataMessage(ws, clientData, message) {
        if (this.config.enableAuthentication && !clientData.isAuthenticated) {
            this._sendToClient(ws, {
                type: 'error',
                message: 'Authentication required',
                timestamp: new Date().toISOString()
            });
            return;
        }

        try {
            const data = message.data || message.payload || message;
            const dataType = message.dataType || 'general';
            
            // Validate data if enabled
            if (this.config.enableDataValidation && !this._validateData(data, dataType)) {
                this._sendToClient(ws, {
                    type: 'data_response',
                    success: false,
                    message: 'Data validation failed',
                    requestId: message.requestId,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Add metadata
            const dataToSave = {
                ...data,
                client_id: clientData.id,
                client_ip: clientData.ip,
                client_type: clientData.clientType,
                data_type: dataType,
                received_at: new Date().toISOString()
            };

            // Save to database if configured
            if (this.db && this.config.dbTableName) {
                this._saveToDatabase(dataToSave, ws, clientData, message.requestId);
            } else {
                // Send success response even if no database
                this._sendToClient(ws, {
                    type: 'data_response',
                    success: true,
                    requestId: message.requestId,
                    timestamp: new Date().toISOString()
                });
            }

            this._log('info', `Data received from ${clientData.id} (${dataType}):`, data);

            // Emit event for application handling
            this.emit('data-received', {
                clientId: clientData.id,
                clientType: clientData.clientType,
                dataType: dataType,
                data: data,
                timestamp: new Date().toISOString()
            });

            // Send to renderer for real-time display
            this._sendToRenderer('websocket-data-received', {
                clientId: clientData.id,
                clientType: clientData.clientType,
                dataType: dataType,
                data: data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this._log('error', `Error processing data from ${clientData.id}: ${error.message}`);
            this._sendToClient(ws, {
                type: 'data_response',
                success: false,
                message: 'Error processing data',
                requestId: message.requestId,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Handle request-response pattern
    _handleRequest(ws, clientData, message) {
        if (!this.config.enableRequestResponse) {
            this._sendToClient(ws, {
                type: 'error',
                message: 'Request-response not enabled',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const { requestId, endpoint, data } = message;
        
        this._log('info', `Request from ${clientData.id}: ${endpoint}`);
        
        // Emit request event for application handling
        this.emit('request', {
            clientId: clientData.id,
            requestId,
            endpoint,
            data,
            respond: (responseData, error = null) => {
                this._sendToClient(ws, {
                    type: 'response',
                    requestId,
                    success: !error,
                    data: responseData,
                    error: error?.message || null,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    // Handle response to our requests
    _handleResponse(ws, clientData, message) {
        const { requestId, success, data, error } = message;
        
        if (this.pendingRequests.has(requestId)) {
            const request = this.pendingRequests.get(requestId);
            clearTimeout(request.timeout);
            this.pendingRequests.delete(requestId);
            
            if (success) {
                request.resolve(data);
            } else {
                request.reject(new Error(error || 'Request failed'));
            }
        }
    }

    // Handle subscription
    _handleSubscribe(ws, clientData, message) {
        if (!this.config.enablePubSub) {
            this._sendToClient(ws, {
                type: 'error',
                message: 'Pub-Sub not enabled',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const { topic } = message;
        
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
        }
        
        this.subscriptions.get(topic).add(ws);
        clientData.subscriptions.add(topic);
        
        this._sendToClient(ws, {
            type: 'subscribe_response',
            success: true,
            topic,
            timestamp: new Date().toISOString()
        });

        this._log('info', `Client ${clientData.id} subscribed to ${topic}`);
        this.emit('client-subscribed', { clientId: clientData.id, topic });
    }

    // Handle unsubscription
    _handleUnsubscribe(ws, clientData, message) {
        const { topic } = message;
        
        if (this.subscriptions.has(topic)) {
            this.subscriptions.get(topic).delete(ws);
            if (this.subscriptions.get(topic).size === 0) {
                this.subscriptions.delete(topic);
            }
        }
        
        clientData.subscriptions.delete(topic);
        
        this._sendToClient(ws, {
            type: 'unsubscribe_response',
            success: true,
            topic,
            timestamp: new Date().toISOString()
        });

        this._log('info', `Client ${clientData.id} unsubscribed from ${topic}`);
        this.emit('client-unsubscribed', { clientId: clientData.id, topic });
    }

    // Handle publish
    _handlePublish(ws, clientData, message) {
        if (!this.config.enablePubSub) {
            this._sendToClient(ws, {
                type: 'error',
                message: 'Pub-Sub not enabled',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const { topic, data } = message;
        
        this.publish(topic, data, clientData.id);
        
        this._sendToClient(ws, {
            type: 'publish_response',
            success: true,
            topic,
            timestamp: new Date().toISOString()
        });
    }

    // Handle RPC calls
    _handleRPCCall(ws, clientData, message) {
        if (!this.config.enableRPC) {
            this._sendToClient(ws, {
                type: 'error',
                message: 'RPC not enabled',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const { requestId, method, params } = message;
        
        if (this.rpcMethods.has(method)) {
            const rpcMethod = this.rpcMethods.get(method);
            
            try {
                const result = rpcMethod(params, clientData);
                
                if (result instanceof Promise) {
                    result
                        .then(data => {
                            this._sendToClient(ws, {
                                type: 'rpc_response',
                                requestId,
                                success: true,
                                data,
                                timestamp: new Date().toISOString()
                            });
                        })
                        .catch(error => {
                            this._sendToClient(ws, {
                                type: 'rpc_response',
                                requestId,
                                success: false,
                                error: error.message,
                                timestamp: new Date().toISOString()
                            });
                        });
                } else {
                    this._sendToClient(ws, {
                        type: 'rpc_response',
                        requestId,
                        success: true,
                        data: result,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                this._sendToClient(ws, {
                    type: 'rpc_response',
                    requestId,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            this._sendToClient(ws, {
                type: 'rpc_response',
                requestId,
                success: false,
                error: `Method ${method} not found`,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Handle stream start
    _handleStreamStart(ws, clientData, message) {
        if (!this.config.enableStreaming) {
            this._sendToClient(ws, {
                type: 'error',
                message: 'Streaming not enabled',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const { streamId, streamType } = message;
        
        this.streams.set(streamId, {
            clientId: clientData.id,
            ws: ws,
            streamType: streamType,
            startedAt: new Date()
        });
        
        this._sendToClient(ws, {
            type: 'stream_start_response',
            success: true,
            streamId,
            timestamp: new Date().toISOString()
        });

        this.emit('stream-started', { clientId: clientData.id, streamId, streamType });
    }

    // Handle stream data
    _handleStreamData(ws, clientData, message) {
        const { streamId, data, sequenceNumber } = message;
        
        this.emit('stream-data', {
            clientId: clientData.id,
            streamId,
            data,
            sequenceNumber,
            timestamp: new Date().toISOString()
        });
    }

    // Handle stream end
    _handleStreamEnd(ws, clientData, message) {
        const { streamId } = message;
        
        if (this.streams.has(streamId)) {
            this.streams.delete(streamId);
            this.emit('stream-ended', { clientId: clientData.id, streamId });
        }
        
        this._sendToClient(ws, {
            type: 'stream_end_response',
            success: true,
            streamId,
            timestamp: new Date().toISOString()
        });
    }

    // Handle binary messages
    _handleBinaryMessage(ws, clientData, buffer) {
        this.emit('binary-data', {
            clientId: clientData.id,
            data: buffer,
            timestamp: new Date().toISOString()
        });
    }

    // Handle heartbeat (existing method)
    _handleHeartbeat(ws, clientData, message) {
        clientData.lastHeartbeat = new Date();
        this._sendToClient(ws, {
            type: 'heartbeat_response',
            timestamp: new Date().toISOString()
        });
        this._log('debug', `Heartbeat from client ${clientData.id}`);
    }

    // Public API methods for applications

    // Send request to client and wait for response
    async sendRequest(clientId, endpoint, data, timeout = this.config.requestTimeout) {
        const client = this._getClientByIdAndSocket();
        if (!client) {
            throw new Error(`Client ${clientId} not found`);
        }

        const requestId = this._generateRequestId();
        
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Request timeout'));
            }, timeout);

            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout: timeoutHandle
            });

            this._sendToClient(client.ws, {
                type: 'request',
                requestId,
                endpoint,
                data,
                timestamp: new Date().toISOString()
            });
        });
    }

    // Publish to topic
    publish(topic, data, excludeClientId = null) {
        if (!this.subscriptions.has(topic)) {
            return 0;
        }

        const subscribers = this.subscriptions.get(topic);
        let publishCount = 0;

        subscribers.forEach(ws => {
            const clientData = this.clients.get(ws);
            if (clientData && clientData.id !== excludeClientId && ws.readyState === WebSocket.OPEN) {
                this._sendToClient(ws, {
                    type: 'publish',
                    topic,
                    data,
                    timestamp: new Date().toISOString()
                });
                publishCount++;
            }
        });

        this._log('info', `Published to ${topic}: ${publishCount} subscribers`);
        return publishCount;
    }

    // Register RPC method
    registerRPCMethod(methodName, handler) {
        this.rpcMethods.set(methodName, handler);
        this._log('info', `RPC method registered: ${methodName}`);
    }

    // Unregister RPC method
    unregisterRPCMethod(methodName) {
        this.rpcMethods.delete(methodName);
        this._log('info', `RPC method unregistered: ${methodName}`);
    }

    // Send data to specific client
    sendToClient(clientId, data) {
        const client = this._getClientByIdAndSocket();
        if (client) {
            this._sendToClient(client.ws, {
                type: 'data',
                data,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        return false;
    }

    // Broadcast message to all connected clients (existing method enhanced)
    broadcastToAll(message, clientTypeFilter = null) {
        const messageObj = typeof message === 'object' ? message : { data: message };
        messageObj.type = messageObj.type || 'broadcast';
        messageObj.timestamp = new Date().toISOString();
        
        const messageStr = JSON.stringify(messageObj);
        let sentCount = 0;

        this.clients.forEach((clientData, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                if (!clientTypeFilter || clientData.clientType === clientTypeFilter) {
                    try {
                        ws.send(messageStr);
                        sentCount++;
                    } catch (error) {
                        this._log('error', `Error broadcasting to client ${clientData.id}: ${error.message}`);
                    }
                }
            }
        });

        this._log('info', `Broadcast sent to ${sentCount} clients${clientTypeFilter ? ` (${clientTypeFilter} only)` : ''}`);
        return sentCount;
    }

    // Start streaming to client
    startStream(clientId, streamId, streamType) {
        const client = this._getClientByIdAndSocket(clientId);
        if (client) {
            this._sendToClient(client.ws, {
                type: 'stream_start',
                streamId,
                streamType,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        return false;
    }

    // Send stream data
    sendStreamData(streamId, data, sequenceNumber = null) {
        if (this.streams.has(streamId)) {
            const stream = this.streams.get(streamId);
            this._sendToClient(stream.ws, {
                type: 'stream_data',
                streamId,
                data,
                sequenceNumber,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        return false;
    }

    // End stream
    endStream(streamId) {
        if (this.streams.has(streamId)) {
            const stream = this.streams.get(streamId);
            this._sendToClient(stream.ws, {
                type: 'stream_end',
                streamId,
                timestamp: new Date().toISOString()
            });
            this.streams.delete(streamId);
            return true;
        }
        return false;
    }

    // Get client by ID
    _getClientByIdAndSocket(clientId) {
        for (const [ws, clientData] of this.clients) {
            if (clientData.id === clientId) {
                return { ws, clientData };
            }
        }
        return null;
    }

    // Validate data based on type
    _validateData(data, dataType) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Type-specific validation
        switch (dataType) {
            case 'sensor':
                // Legacy sensor data validation
                return this._validateSensorData(data);
            
            case 'application':
                // Application data validation
                return this._validateApplicationData(data);
            
            case 'service':
                // Service data validation
                return this._validateServiceData(data);
            
            default:
                // General validation - check required fields
                return this._validateSensorData(data); // Fallback to sensor validation
        }
    }

    // Validate sensor data (existing method)
    _validateSensorData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check required fields
        for (const field of this.config.requiredFields) {
            if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
                this._log('warn', `Missing required field: ${field}`);
                return false;
            }
        }

        return true;
    }

    // Validate application data
    _validateApplicationData(data) {
        // Application-specific validation logic
        if (!data.hasOwnProperty('payload') && !data.hasOwnProperty('data')) {
            this._log('warn', 'Application data must have payload or data field');
            return false;
        }
        return true;
    }

    // Validate service data
    _validateServiceData(data) {
        // Service-specific validation logic
        if (!data.hasOwnProperty('service') || !data.hasOwnProperty('operation')) {
            this._log('warn', 'Service data must have service and operation fields');
            return false;
        }
        return true;
    }

    // Save data to database (enhanced)
    async _saveToDatabase(data, ws, clientData, requestId = null) {
        try {
            let dataToInsert = { ...data };

            // Handle encryption if configured
            if (this.db.encrypt && this.config.fieldsToEncrypt && this.config.fieldsToEncrypt.length > 0) {
                for (const field of this.config.fieldsToEncrypt) {
                    if (dataToInsert.hasOwnProperty(field) && dataToInsert[field] !== null && dataToInsert[field] !== undefined) {
                        try {
                            dataToInsert[field] = this.db.encrypt(String(dataToInsert[field]));
                            this._log('debug', `Field '${field}' encrypted`);
                        } catch (encError) {
                            this._log('error', `Error encrypting field '${field}': ${encError.message}`);
                        }
                    }
                }
            }

            const result = await this.db.postData(this.config.dbTableName, dataToInsert);
            
            this._log('info', `Data saved to database (${this.config.dbTableName}): ID ${result.insertId}`);

            // Send success response to client
            this._sendToClient(ws, {
                type: 'data_response',
                success: true,
                insertId: result.insertId,
                requestId: requestId,
                timestamp: new Date().toISOString()
            });

            // Send to renderer
            this._sendToRenderer('websocket-database-insert', {
                clientId: clientData.id,
                table: this.config.dbTableName,
                insertId: result.insertId,
                data: data,
                timestamp: new Date().toISOString()
            });

            // Emit event
            this.emit('database-insert', {
                clientId: clientData.id,
                insertId: result.insertId,
                data: data
            });

        } catch (error) {
            this._log('error', `Database error for client ${clientData.id}: ${error.message}`);
            
            this._sendToClient(ws, {
                type: 'data_response',
                success: false,
                message: 'Database error',
                requestId: requestId,
                timestamp: new Date().toISOString()
            });

            this._sendToRenderer('websocket-database-error', {
                clientId: clientData.id,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            // Emit event
            this.emit('database-error', {
                clientId: clientData.id,
                error: error
            });
        }
    }

    // Handle client disconnection (enhanced)
    _handleClientDisconnection(ws, clientData, code, reason) {
        this._log('info', `Client ${clientData.id} disconnected (${code}: ${reason})`);
        
        // Clean up subscriptions
        clientData.subscriptions.forEach(topic => {
            if (this.subscriptions.has(topic)) {
                this.subscriptions.get(topic).delete(ws);
                if (this.subscriptions.get(topic).size === 0) {
                    this.subscriptions.delete(topic);
                }
            }
        });

        // Clean up streams
        for (const [streamId, stream] of this.streams) {
            if (stream.clientId === clientData.id) {
                this.streams.delete(streamId);
                this.emit('stream-ended', { clientId: clientData.id, streamId });
            }
        }

        this.clients.delete(ws);
        this.connectionCount--;

        this._sendToRenderer('websocket-client-disconnected', {
            clientId: clientData.id,
            ip: clientData.ip,
            clientType: clientData.clientType,
            connectedDuration: Date.now() - clientData.connectedAt.getTime(),
            dataReceived: clientData.dataReceived,
            totalConnections: this.connectionCount,
            timestamp: new Date().toISOString()
        });

        this.emit('client-disconnected', {
            clientId: clientData.id,
            clientType: clientData.clientType,
            connectedDuration: Date.now() - clientData.connectedAt.getTime(),
            dataReceived: clientData.dataReceived
        });
    }

    // Start heartbeat for client (existing method)
    _startClientHeartbeat(ws, clientData) {
        const heartbeatTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const timeSinceLastHeartbeat = Date.now() - clientData.lastHeartbeat.getTime();
                
                if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
                    this._log('warn', `Client ${clientData.id} heartbeat timeout, closing connection`);
                    ws.close(1000, 'Heartbeat timeout');
                    clearInterval(heartbeatTimer);
                } else {
                    ws.ping();
                }
            } else {
                clearInterval(heartbeatTimer);
            }
        }, this.config.heartbeatInterval);
    }

    // Send message to specific client (existing method)
    _sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                this._log('error', `Error sending message to client: ${error.message}`);
            }
        }
    }

    // Setup default RPC methods
    _setupRPCMethods() {
        // Server info
        this.registerRPCMethod('server.info', () => ({
            version: '2.0.0',
            features: {
                requestResponse: this.config.enableRequestResponse,
                pubSub: this.config.enablePubSub,
                rpc: this.config.enableRPC,
                streaming: this.config.enableStreaming
            },
            uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0,
            connections: this.connectionCount
        }));

        // Get server stats
        this.registerRPCMethod('server.stats', () => ({
            totalConnections: this.connectionCount,
            activeStreams: this.streams.size,
            activeSubscriptions: this.subscriptions.size,
            pendingRequests: this.pendingRequests.size,
            uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0
        }));

        // List topics
        this.registerRPCMethod('pubsub.topics', () => Array.from(this.subscriptions.keys()));

        // List active streams
        this.registerRPCMethod('streams.list', () => {
            const streamList = [];
            for (const [streamId, stream] of this.streams) {
                streamList.push({
                    streamId,
                    clientId: stream.clientId,
                    streamType: stream.streamType,
                    startedAt: stream.startedAt
                });
            }
            return streamList;
        });

        // Echo method for testing
        this.registerRPCMethod('echo', (params) => params);
    }

    // Get server status (enhanced)
    getStatus() {
        const clientsInfo = Array.from(this.clients.values()).map(client => ({
            id: client.id,
            ip: client.ip,
            clientType: client.clientType,
            connectedAt: client.connectedAt,
            isAuthenticated: client.isAuthenticated,
            dataReceived: client.dataReceived,
            lastDataTime: client.lastDataTime,
            subscriptions: Array.from(client.subscriptions),
            capabilities: Array.from(client.capabilities)
        }));

        const topicsInfo = Array.from(this.subscriptions.entries()).map(([topic, subscribers]) => ({
            topic,
            subscriberCount: subscribers.size
        }));

        const streamsInfo = Array.from(this.streams.entries()).map(([streamId, stream]) => ({
            streamId,
            clientId: stream.clientId,
            streamType: stream.streamType,
            startedAt: stream.startedAt
        }));

        return {
            isRunning: this.isRunning,
            port: this.config.port,
            host: this.config.host,
            connectionCount: this.connectionCount,
            maxConnections: this.config.maxConnections,
            authEnabled: this.config.enableAuthentication,
            authToken: this.config.enableAuthentication ? this.config.authToken : null,
            features: {
                requestResponse: this.config.enableRequestResponse,
                pubSub: this.config.enablePubSub,
                rpc: this.config.enableRPC,
                streaming: this.config.enableStreaming,
                binaryData: this.config.enableBinaryData,
                compression: this.config.enableCompression
            },
            clients: clientsInfo,
            topics: topicsInfo,
            streams: streamsInfo,
            pendingRequests: this.pendingRequests.size,
            rpcMethods: Array.from(this.rpcMethods.keys()),
            uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0
        };
    }

    // Utility methods (existing enhanced)
    _generateAuthToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    _generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _log(level, message, data = null) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const configLevel = levels[this.config.logLevel] || 1;
        
        if (levels[level] >= configLevel) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [WebSocket-${level.toUpperCase()}] ${message}`;
            
            console.log(logMessage);
            if (data) {
                console.log(data);
            }
        }
    }

    _sendToRenderer(channel, data) {
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send(channel, data);
        }
    }
}

module.exports = WebSocketHandler;