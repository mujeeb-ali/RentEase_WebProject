// ===================================
// Chat JavaScript with Socket.io
// ===================================

// Check authentication
window.rentease.utils.requireAuth();

const SOCKET_URL = window.CONFIG?.SOCKET_URL || 'https://rentease-backend-production.up.railway.app';

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
    
    socket = io(SOCKET_URL, {
        auth: {
            token: currentUser.token
        }
    });
    
    // Socket event listeners
    socket.on('connect', () => {
        socket.emit('join', currentUser.id);
    });
    
    socket.on('disconnect', () => {
        // Handle disconnection
    });
    
    // Receive new message
    socket.on('receiveMessage', (message) => {
        handleNewMessage(message);
    });
    
    socket.on('messageSent', (data) => {
        // Message sent successfully
        if (data.isDelivered) {
            updateMessageDeliveryStatus(data.messageId, true);
        }
    });
    
    // Message delivered confirmation
    socket.on('messageDelivered', (data) => {
        updateMessageDeliveryStatus(data.messageId, true);
    });
    
    // Message read confirmation
    socket.on('messageReadConfirm', (data) => {
        updateMessageReadStatus(data.messageId);
    });
    
    // Message read status
    socket.on('messageRead', (data) => {
        updateMessageReadStatus(data.messageId);
    });
    
    // User typing indicator
    socket.on('userTyping', (data) => {
        showTypingIndicator(data.senderId);
    });
    
    // User stopped typing
    socket.on('userStoppedTyping', (data) => {
        hideTypingIndicator(data.senderId);
    });
    
    // User online/offline status
    socket.on('userStatusChange', (data) => {
        updateUserOnlineStatus(data.userId, data.status, data.lastSeen);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        window.rentease.utils.showNotification(error.message || 'Chat connection error', 'error');
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
    
    // Typing indicator on input
    const messageInput = document.getElementById('messageInput');
    if (messageInput && !messageInput.dataset.listenerAdded) {
        let typingTimeout;
        messageInput.addEventListener('input', function() {
            if (currentChatUserId && socket) {
                socket.emit('typing', { senderId: currentUser.id, receiverId: currentChatUserId });
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    socket.emit('stopTyping', { senderId: currentUser.id, receiverId: currentChatUserId });
                }, 1000);
            }
        });
        messageInput.dataset.listenerAdded = 'true';
    }
    
    // Image upload button
    const imageUploadBtn = document.getElementById('imageUploadBtn');
    const imageInput = document.getElementById('imageInput');
    if (imageUploadBtn && imageInput && !imageUploadBtn.dataset.listenerAdded) {
        imageUploadBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageUpload);
        imageUploadBtn.dataset.listenerAdded = 'true';
    }
    
    // Conversation item click - use event delegation ONCE on the parent
    const conversationsList = document.getElementById('conversationsList');
    if (conversationsList && !conversationsList.dataset.listenerAdded) {
        conversationsList.addEventListener('click', function(e) {
            const conversationItem = e.target.closest('.conversation-item');
            if (conversationItem) {
                const userId = conversationItem.dataset.userId;
                const userName = conversationItem.querySelector('h4')?.textContent || 'User';
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
    
    // Delivery/read status for sent messages
    let statusIcon = '';
    if (isSent) {
        if (message.isRead) {
            statusIcon = '<span class="message-status read">✓✓</span>';
        } else if (message.isDelivered) {
            statusIcon = '<span class="message-status">✓✓</span>';
        } else {
            statusIcon = '<span class="message-status">✓</span>';
        }
    }
    
    // Build message content (text or image)
    let messageContent = '';
    if (message.image) {
        messageContent = `<img src="${message.image}" alt="Shared image" style="max-width: 300px; max-height: 300px; object-fit: cover; border-radius: 8px; cursor: pointer; margin-bottom: 0.25rem;" onclick="showImageModal('${message.image}')">`;
        if (messageText && messageText !== '📷 Image') {
            messageContent += `<p>${messageText}</p>`;
        }
    } else if (messageText === '📷 Image') {
        // Image text but no data - show placeholder
        messageContent = `<div style="padding: 1rem; background: #f5f5f5; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #999;">${messageText}</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #ccc;">Image not loaded</p>
        </div>`;
    } else if (messageText) {
        messageContent = `<p>${messageText}</p>`;
    } else {
        messageContent = '<p style="color: #999; font-style: italic;">Message deleted</p>';
    }
    
    messageDiv.innerHTML = `
        <input type="checkbox" class="message-checkbox" style="display: none;" onchange="toggleDeleteButton()">
        ${!isSent ? `<div class="message-avatar" title="${senderName}">${senderAvatar}</div>` : ''}
        <div class="message-content">
            ${!isSent && senderName ? `<div class="message-sender">${senderName}</div>` : ''}
            <div class="message-bubble">
                ${messageContent}
                <span class="message-time">${time} ${statusIcon}</span>
            </div>
            <div class="message-menu">
                <button class="message-menu-btn" onclick="toggleMessageMenu(this)">⋮</button>
                <div class="message-dropdown">
                    <button onclick="copyMessage('${messageText.replace(/'/g, "\\'")}')">📋 Copy</button>
                    <button onclick="shareMessage('${messageText.replace(/'/g, "\\'")}')">↗️ Forward</button>
                    <button class="delete" onclick="deleteMessage('${messageDiv.dataset.messageId}', this)">🗑️ Delete</button>
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

// Share Message (Forward to another user)
window.shareMessage = function(text) {
    // Show modal to select user to forward to
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%;">
            <h3 style="margin: 0 0 1rem 0; color: var(--primary-blue);">Forward Message</h3>
            <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">Select a conversation to forward this message to:</p>
            <div id="forwardUserList" style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;"></div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button onclick="this.closest('div[style*=fixed]').remove()" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load conversations for forwarding
    loadForwardList(text);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('show'));
};

// Load conversations for forwarding
async function loadForwardList(messageText) {
    const forwardList = document.getElementById('forwardUserList');
    forwardList.innerHTML = '<p style="text-align: center; padding: 1rem; color: #999;">Loading...</p>';
    
    try {
        const response = await fetch(`${API_URL}/messages/conversations/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success && data.conversations && data.conversations.length > 0) {
            forwardList.innerHTML = data.conversations.map(conv => {
                // Backend returns { userId, name, email, lastMessage, unreadCount }
                if (!conv.userId || !conv.name) {
                    return '';
                }
                
                return `
                    <div onclick="forwardMessageTo('${conv.userId}', \`${messageText.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, '${conv.name.replace(/'/g, "\\'")}'); event.stopPropagation();" 
                         style="padding: 0.75rem; border: 1px solid #eee; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;"
                         onmouseover="this.style.background='#f5f5f5'"
                         onmouseout="this.style.background='white'">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                            ${conv.avatar || '👤'}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #333;">${conv.name}</div>
                            <div style="font-size: 0.85rem; color: #999;">${conv.email || ''}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            forwardList.innerHTML = `<p style="text-align: center; padding: 1rem; color: #999;">No conversations found. Start chatting with someone first!</p>`;
        }
    } catch (error) {
        forwardList.innerHTML = `<p style="text-align: center; padding: 1rem; color: #f44;">Error loading conversations: ${error.message}</p>`;
    }
}

// Forward message to selected user
window.forwardMessageTo = async function(userId, messageText, userName) {
    try {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({
                senderId: currentUser.id,
                receiverId: userId,
                text: `📩 Forwarded: ${messageText}`
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            window.rentease.utils.showNotification(`Message forwarded to ${userName}`, 'success');
            document.querySelector('div[style*="fixed"]').remove();
        } else {
            window.rentease.utils.showNotification(data.message || 'Failed to forward message', 'error');
        }
    } catch (error) {
        window.rentease.utils.showNotification('Failed to forward message', 'error');
    }
};

// Helper function to copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        window.rentease.utils.showNotification('Message copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        window.rentease.utils.showNotification('Message copied!', 'success');
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.message-menu')) {
        document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('show'));
    }
});

// Toggle Select Mode
window.toggleSelectMode = function() {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    const isSelecting = checkboxes[0]?.style.display === 'none';
    
    checkboxes.forEach(cb => {
        cb.style.display = isSelecting ? 'block' : 'none';
        cb.checked = false;
    });
    
    document.getElementById('selectModeBtn').textContent = isSelecting ? '✖️' : '☑️';
    document.getElementById('deleteSelectedBtn').style.display = 'none';
};

// Toggle Delete Button based on selection
window.toggleDeleteButton = function() {
    const selected = document.querySelectorAll('.message-checkbox:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    deleteBtn.style.display = selected.length > 0 ? 'block' : 'none';
    
    if (deleteBtn.style.display === 'block') {
        deleteBtn.textContent = `🗑️ (${selected.length})`;
    }
};

// Delete Selected Messages
window.deleteSelectedMessages = async function() {
    const selected = document.querySelectorAll('.message-checkbox:checked');
    if (selected.length === 0) return;
    
    if (!confirm(`Delete ${selected.length} message(s)?`)) return;
    
    const messageIds = Array.from(selected).map(cb => cb.closest('.message').dataset.messageId);
    
    try {
        const deletePromises = messageIds.map(id => 
            fetch(`${API_URL}/messages/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            })
        );
        
        await Promise.all(deletePromises);
        
        // Remove messages from UI
        selected.forEach(cb => {
            const messageDiv = cb.closest('.message');
            messageDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        });
        
        window.rentease.utils.showNotification(`${messageIds.length} message(s) deleted`, 'success');
        toggleSelectMode(); // Exit select mode
    } catch (error) {
        console.error('Error deleting messages:', error);
        window.rentease.utils.showNotification('Failed to delete some messages', 'error');
    }
};

// Switch Conversation
function switchConversation(userId, userName) {
    currentChatUserId = userId;
    
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
    
    // Mark messages as read
    markAsRead(userId);
    
    // Clear unread badge
    const unreadBadge = document.querySelector(`[data-user-id="${userId}"] .unread-badge`);
    if (unreadBadge) {
        unreadBadge.remove();
    }
    
    // Focus message input
    setTimeout(() => {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
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
        
        // Emit read status for received messages
        if (!isSent && socket && message._id) {
            socket.emit('messageRead', {
                messageId: message._id,
                senderId: senderId,
                receiverId: currentUser.id
            });
        }
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
        const response = await fetch(`${API_URL}/messages/conversations/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.conversations) {
            renderConversations(data.conversations);
        } else {
            conversationsList.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-muted);">No conversations yet<br><small>Start chatting by viewing a property!</small></p>';
        }
    } catch (error) {
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

// ========== NEW FEATURES ==========

// Image upload handler
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
        window.rentease.utils.showNotification('Please select an image file', 'error');
        return;
    }
    
    if (!currentChatUserId) {
        window.rentease.utils.showNotification('Please select a conversation first', 'error');
        return;
    }
    
    // Compress image before uploading
    compressImage(file, (compressedBase64) => {
        sendMediaMessage(compressedBase64, 'image');
        e.target.value = '';
    });
}

// Compress image to reduce file size
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Resize if too large (max 1200px width/height)
            const maxSize = 1200;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.7 quality (reduces size significantly)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedBase64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Send media message
function sendMediaMessage(base64Data, mediaType) {
    const message = {
        senderId: currentUser.id,
        receiverId: currentChatUserId,
        text: '📷 Image',
        image: base64Data,
        mediaType: 'image',
        timestamp: new Date().toISOString()
    };
    
    socket.emit('sendMessage', message);
    appendMessage(message, true);
    
    // Show success notification after a brief delay
    setTimeout(() => {
        window.rentease.utils.showNotification('Image sent!', 'success');
    }, 300);
}

// Typing indicator functions
function showTypingIndicator(senderId) {
    if (senderId !== currentChatUserId) return;
    
    const messagesArea = document.getElementById('messagesArea');
    let typingDiv = document.getElementById('typingIndicator');
    
    if (!typingDiv) {
        typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
            <p style="font-size: 0.75rem; color: #999; margin: 0.25rem 0 0 0;">typing...</p>
        `;
        messagesArea.appendChild(typingDiv);
        scrollToBottom();
    }
}

function hideTypingIndicator(senderId) {
    if (senderId !== currentChatUserId) return;
    
    const typingDiv = document.getElementById('typingIndicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Online status update
function updateUserOnlineStatus(userId, status, lastSeen) {
    // Update in conversation list
    const conversation = document.querySelector(`[data-user-id="${userId}"]`);
    if (conversation) {
        let statusDot = conversation.querySelector('.status-dot');
        if (!statusDot) {
            statusDot = document.createElement('span');
            statusDot.className = 'status-dot';
            const avatar = conversation.querySelector('.conversation-avatar');
            if (avatar) {
                avatar.style.position = 'relative';
                avatar.appendChild(statusDot);
            }
        }
        
        statusDot.className = `status-dot ${status}`;
        statusDot.title = status === 'online' ? 'Online' : `Last seen ${formatTime(lastSeen)}`;
    }
    
    // Update in chat header if this is current conversation
    if (userId === currentChatUserId) {
        const chatStatus = document.getElementById('chatUserStatus');
        if (chatStatus) {
            chatStatus.textContent = status === 'online' ? 'Online' : `Last seen ${formatTime(lastSeen)}`;
            chatStatus.style.color = status === 'online' ? '#4caf50' : '#999';
        }
    }
}

// Delivery status update
function updateMessageDeliveryStatus(messageId, isDelivered) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        let statusSpan = messageDiv.querySelector('.message-status');
        if (!statusSpan) {
            statusSpan = document.createElement('span');
            statusSpan.className = 'message-status';
            const timeSpan = messageDiv.querySelector('.message-time');
            if (timeSpan) {
                timeSpan.after(statusSpan);
            }
        }
        statusSpan.textContent = isDelivered ? '✓✓' : '✓';
        statusSpan.style.color = '#9e9e9e';
    }
}

// Read status update (enhanced)
function updateMessageReadStatus(messageId) {
    const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageDiv) {
        const statusSpan = messageDiv.querySelector('.message-status');
        if (statusSpan) {
            statusSpan.textContent = '✓✓';
            statusSpan.style.color = '#2196F3'; // Blue for read
            statusSpan.classList.add('read');
        }
    }
}

// Show image in modal
window.showImageModal = function(imageSrc) {
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: zoom-out;
    `;
    
    modal.innerHTML = `
        <img src="${imageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">
        <button style="position: absolute; top: 20px; right: 20px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 1.5rem; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.3);" onclick="document.getElementById('imageModal').remove()">×</button>
    `;
    
    modal.onclick = function() {
        modal.remove();
    };
    
    document.body.appendChild(modal);
};
