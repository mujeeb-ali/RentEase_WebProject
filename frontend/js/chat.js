// ===================================
// Chat JavaScript with Socket.io
// ===================================

// Check authentication
window.rentease.utils.requireAuth();

const SOCKET_URL = window.CONFIG?.SOCKET_URL || (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://your-domain.com');

let socket = null;
let currentChatUserId = null;
const currentUser = window.rentease.utils.getUser();

// Initialize Socket.io
document.addEventListener('DOMContentLoaded', function() {
    // Hide Add Property link for buyers/tenants
    const user = window.rentease.utils.getUser();
    if (user && user.role === 'tenant') {
        const addPropertyLink = document.getElementById('addPropertyNavLink');
        if (addPropertyLink) {
            addPropertyLink.style.display = 'none';
        }
    }
    
    // Clear placeholder messages from HTML
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
        messagesArea.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;"><h3>No Conversation Selected</h3><p>Select a conversation to start chatting</p></p>';
    }
    
    // Check for URL parameters (direct chat link)
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('userId');
    const targetUserName = urlParams.get('userName');
    
    if (targetUserId) {
        currentChatUserId = targetUserId;
        updateChatHeader(targetUserId, targetUserName);
        loadChatHistory(targetUserId);
    }
    
    initializeSocket();
    setupEventListeners();
    loadConversations();
});

// Initialize Socket Connection
function initializeSocket() {
    if (!currentUser) return;
    
    console.log('🔌 Initializing socket for user:', currentUser.id);
    
    socket = io(SOCKET_URL, {
        auth: {
            token: currentUser.token
        }
    });
    
    // Socket event listeners
    socket.on('connect', () => {
        console.log('✅ Connected to chat server, Socket ID:', socket.id);
        // Join user's room
        socket.emit('join', currentUser.id);
        console.log('📥 Joined room for user:', currentUser.id);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Disconnected from chat server');
    });
    
    // Receive new message
    socket.on('receiveMessage', (message) => {
        console.log('📨 Received message:', message);
        handleNewMessage(message);
    });
    
    socket.on('messageSent', (data) => {
        console.log('✅ Message sent confirmation:', data);
    });
    
    // Message read status
    socket.on('messageRead', (data) => {
        console.log('👁️ Message read:', data);
        updateMessageReadStatus(data.messageId);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        window.rentease.utils.showNotification('Chat connection error', 'error');
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Message form submit - only set up once, don't re-add
    const messageForm = document.getElementById('messageForm');
    if (messageForm && !messageForm.dataset.listenerAdded) {
        messageForm.addEventListener('submit', sendMessage);
        messageForm.dataset.listenerAdded = 'true';
    }
    
    // Conversation item click - use event delegation ONCE on the parent
    const conversationsList = document.getElementById('conversationsList');
    if (conversationsList && !conversationsList.dataset.listenerAdded) {
        conversationsList.addEventListener('click', function(e) {
            const conversationItem = e.target.closest('.conversation-item');
            if (conversationItem) {
                const userId = conversationItem.dataset.userId;
                const userName = conversationItem.querySelector('h4')?.textContent || 'User';
                console.log('Conversation clicked:', userId, userName);
                switchConversation(userId, userName);
            }
        });
        conversationsList.dataset.listenerAdded = 'true';
    }
    
    // Search conversations - set up once
    const searchInput = document.getElementById('searchConversations');
    if (searchInput && !searchInput.dataset.listenerAdded) {
        searchInput.addEventListener('input', function(e) {
            filterConversations(e.target.value);
        });
        searchInput.dataset.listenerAdded = 'true';
    }
}

// Send Message
function sendMessage(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    
    if (!currentChatUserId) {
        window.rentease.utils.showNotification('Please select a conversation first', 'error');
        return;
    }
    
    if (!socket || !socket.connected) {
        window.rentease.utils.showNotification('Not connected to chat server', 'error');
        return;
    }
    
    const message = {
        senderId: currentUser.id,
        receiverId: currentChatUserId,
        text: messageText,
        timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending message:', message);
    
    // Emit message via Socket.io
    socket.emit('sendMessage', message);
    
    // Add message to UI immediately
    appendMessage(message, true);
    
    // Clear input
    messageInput.value = '';
}

// Save Message to Database
async function saveMessageToDatabase(message) {
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(message)
        });
    } catch (error) {
        console.error('Error saving message:', error);
    }
}

// Handle New Message from Socket
function handleNewMessage(message) {
    console.log('📬 Handling new message from:', message.senderId, 'Current chat:', currentChatUserId);
    
    // Only append if message is for current conversation
    if (message.senderId === currentChatUserId) {
        appendMessage(message, false);
        
        // Mark conversation as read and emit read status
        markAsRead(currentChatUserId);
        
        // Emit message read event back to sender
        if (socket && message._id) {
            socket.emit('messageRead', {
                messageId: message._id,
                senderId: message.senderId,
                receiverId: currentUser.id
            });
        }
    } else {
        // Update unread count
        updateUnreadCount(message.senderId);
        
        // Show notification
        if (window.rentease && window.rentease.utils) {
            window.rentease.utils.showNotification('New message received', 'info');
        }
    }
}

// Append Message to Chat Window
function appendMessage(message, isSent) {
    const messagesArea = document.getElementById('messagesArea');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.messageId = message._id || Date.now();
    
    // Handle both timestamp and createdAt fields
    const timestamp = message.timestamp || message.createdAt || new Date();
    const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
    
    // Get sender name for received messages
    const senderName = !isSent && message.senderId?.fullName ? message.senderId.fullName : '';
    const senderAvatar = !isSent && message.senderId?.avatar ? message.senderId.avatar : '👤';
    
    // Only show text if it exists
    const messageText = escapeHtml(message.text || message.message || '');
    
    messageDiv.innerHTML = `
        ${!isSent ? `<div class="message-avatar" title="${senderName}">${senderAvatar}</div>` : ''}
        <div class="message-content">
            ${!isSent && senderName ? `<div class="message-sender">${senderName}</div>` : ''}
            <div class="message-bubble">
                ${messageText ? `<p>${messageText}</p>` : '<p style="color: #999; font-style: italic;">Message deleted</p>'}
                <span class="message-time">${time}${isSent ? ' <span class="message-status' + (message.read ? ' read' : '') + '">✓✓</span>' : ''}</span>
            </div>
            <div class="message-menu">
                <button class="message-menu-btn" onclick="toggleMessageMenu(this)">⋮</button>
                <div class="message-dropdown">
                    <button onclick="copyMessage('${messageText.replace(/'/g, "\\'")}')">📋 Copy</button>
                    ${isSent ? `<button class="delete" onclick="deleteMessage('${messageDiv.dataset.messageId}', this)">🗑️ Delete</button>` : ''}
                </div>
            </div>
        </div>
    `;
    
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to bottom of messages
function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

// Update message read status in UI
function updateMessageReadStatus(messageId) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        const statusSpan = messageDiv.querySelector('.message-status');
        if (statusSpan) {
            statusSpan.classList.add('read');
        }
    }
}

// Toggle message menu
window.toggleMessageMenu = function(btn) {
    const dropdown = btn.nextElementSibling;
    const wasOpen = dropdown.classList.contains('show');
    
    // Close all dropdowns
    document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('show'));
    
    // Toggle current dropdown
    if (!wasOpen) {
        dropdown.classList.add('show');
    }
};

// Copy message
window.copyMessage = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        window.rentease.utils.showNotification('Message copied', 'success');
        document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('show'));
    });
};

// Delete message
window.deleteMessage = async function(messageId, btn) {
    if (!confirm('Delete this message?')) return;
    
    try {
        const response = await fetch(`${API_URL}/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (response.ok) {
            // Remove message from UI
            const messageDiv = btn.closest('.message');
            messageDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
            window.rentease.utils.showNotification('Message deleted', 'success');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        window.rentease.utils.showNotification('Failed to delete message', 'error');
    }
    
    document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('show'));
};

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.message-menu')) {
        document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('show'));
    }
});

// Switch Conversation
function switchConversation(userId, userName) {
    console.log('Switching conversation to:', userId, userName);
    currentChatUserId = userId;
    
    // Debug: Check if message input exists
    const messageInputArea = document.querySelector('.message-input-area');
    const messageInput = document.getElementById('messageInput');
    const messageForm = document.getElementById('messageForm');
    
    console.log('🔍 Debug - Message Input Area:', messageInputArea);
    console.log('🔍 Debug - Message Input Field:', messageInput);
    console.log('🔍 Debug - Message Form:', messageForm);
    
    if (messageInputArea) {
        const styles = window.getComputedStyle(messageInputArea);
        console.log('📊 Input Area Display:', styles.display);
        console.log('📊 Input Area Visibility:', styles.visibility);
        console.log('📊 Input Area Height:', styles.height);
    }
    
    // Update active state
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    const selectedItem = document.querySelector(`[data-user-id="${userId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Update chat header
    updateChatHeader(userId, userName);
    
    // Load chat history
    loadChatHistory(userId);
    
    // Clear unread badge
    const unreadBadge = document.querySelector(`[data-user-id="${userId}"] .unread-badge`);
    if (unreadBadge) {
        unreadBadge.remove();
    }
    
    // Ensure message input is focused and visible
    setTimeout(() => {
        if (messageInput) {
            messageInput.focus();
            console.log('✅ Message input is ready and focused');
        } else {
            console.error('❌ Message input not found!');
        }
    }, 100);
}

// Load Chat History
async function loadChatHistory(userId) {
    try {
        const response = await fetch(`${API_URL}/messages/${currentUser.id}/${userId}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderChatHistory(data.messages);
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Render Chat History
function renderChatHistory(messages) {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        messagesArea.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No messages yet. Start the conversation!</p>';
        return;
    }
    
    messages.forEach(message => {
        // Handle both populated objects and IDs
        const senderId = message.senderId?._id || message.senderId;
        const isSent = senderId.toString() === currentUser.id.toString();
        appendMessage(message, isSent);
    });
    
    // Auto scroll to bottom after rendering
    scrollToBottom();
}

// Update Chat Header
async function updateChatHeader(userId, userName = null) {
    if (userName && userName !== 'Property Owner') {
        document.getElementById('chatUserName').textContent = userName;
    } else {
        // Fetch user details from API
        try {
            // First try to get from conversation list
            const conversationItem = document.querySelector(`[data-user-id="${userId}"] h4`);
            if (conversationItem) {
                document.getElementById('chatUserName').textContent = conversationItem.textContent;
                return;
            }
            
            // If not in conversation list, fetch from properties (owner info)
            const response = await fetch(`${API_URL}/properties/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.properties && data.properties[0]?.owner) {
                    const ownerName = data.properties[0].owner.fullName || 'Property Owner';
                    document.getElementById('chatUserName').textContent = ownerName;
                    return;
                }
            }
            
            // Fallback
            document.getElementById('chatUserName').textContent = 'User';
        } catch (error) {
            console.error('Error fetching user name:', error);
            document.getElementById('chatUserName').textContent = 'User';
        }
    }
}

// Load Conversations
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    
    if (!conversationsList) {
        console.error('❌ conversationsList element not found');
        return;
    }
    
    try {
        console.log('🔍 Loading conversations for user:', currentUser.id);
        console.log('📡 API endpoint:', `${API_URL}/messages/conversations/${currentUser.id}`);
        
        const response = await fetch(`${API_URL}/messages/conversations/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        console.log('📥 Conversations API response:', response.status, response.ok);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('💬 Conversations data:', data);
        
        if (data.success && data.conversations) {
            renderConversations(data.conversations);
        } else {
            console.log('📭 No conversations found');
            conversationsList.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-muted);">No conversations yet<br><small>Start chatting by viewing a property!</small></p>';
        }
    } catch (error) {
        console.error('❌ Error loading conversations:', error);
        conversationsList.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-muted);">No conversations yet<br><small>Start chatting by viewing a property!</small></p>';
    }
}

// Render Conversations
function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    
    // Clear loading message first
    conversationsList.innerHTML = '';
    
    if (!conversations || conversations.length === 0) {
        conversationsList.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-muted);">No conversations yet</p>';
        return;
    }
    
    conversationsList.innerHTML = conversations.map(conv => `
        <div class="conversation-item" data-user-id="${conv.userId}">
            <div class="conversation-avatar">${conv.avatar || '👤'}</div>
            <div class="conversation-info">
                <div class="conversation-header">
                    <h4>${conv.name}</h4>
                    <span class="conversation-time">${formatTime(conv.lastMessageTime)}</span>
                </div>
                <p class="conversation-preview">${conv.lastMessage}</p>
                ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    // Note: Event listeners are already set up in DOMContentLoaded, no need to re-add
}

// Filter Conversations
function filterConversations(searchValue) {
    const searchTerm = searchValue.toLowerCase().trim();
    const conversations = document.querySelectorAll('.conversation-item');
    
    let visibleCount = 0;
    
    conversations.forEach(conv => {
        const name = conv.querySelector('h4')?.textContent.toLowerCase() || '';
        const preview = conv.querySelector('.conversation-preview')?.textContent.toLowerCase() || '';
        
        if (name.includes(searchTerm) || preview.includes(searchTerm)) {
            conv.style.display = 'flex';
            visibleCount++;
        } else {
            conv.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    const conversationsList = document.getElementById('conversationsList');
    const noResultsMsg = conversationsList.querySelector('.no-results');
    
    if (visibleCount === 0 && searchTerm) {
        if (!noResultsMsg) {
            const msg = document.createElement('p');
            msg.className = 'no-results';
            msg.style.cssText = 'padding: 1rem; text-align: center; color: var(--text-muted);';
            msg.textContent = 'No conversations found';
            conversationsList.appendChild(msg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function markAsRead(userId) {
    // API call to mark messages as read
    fetch(`${API_URL}/messages/read/${userId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${currentUser.token}`
        }
    }).catch(err => console.error('Error marking as read:', err));
}

function updateUnreadCount(userId) {
    const conversation = document.querySelector(`[data-user-id="${userId}"]`);
    if (!conversation) return;
    
    let badge = conversation.querySelector('.unread-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'unread-badge';
        badge.textContent = '1';
        conversation.querySelector('.conversation-info').appendChild(badge);
    } else {
        badge.textContent = parseInt(badge.textContent) + 1;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
});
