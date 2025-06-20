# Test Data Setup for App Review

## 🧪 Тестові аккаунти для App Review

### Instagram Business Account
- **Username:** @director_test_business
- **Type:** Instagram Business Account
- **Connected Facebook Page:** Director Test Business
- **Purpose:** Основний бізнес аккаунт для тестування

### Test Customer Account  
- **Username:** @director_test_customer
- **Type:** Regular Instagram Account
- **Purpose:** Імітація клієнта для тестування повідомлень

## 📊 Демо данні для БД

### SQL Script для створення тестових лідів:

```sql
-- Додавання тестових лідів
INSERT INTO leads (ig_id, username, full_name, first_seen, status) VALUES
('test_customer_1', 'test_customer_1', 'John Smith', '2024-01-10 10:00:00', 'NEW'),
('test_customer_2', 'sarah_johnson', 'Sarah Johnson', '2024-01-11 14:30:00', 'CONTACTED'),
('test_customer_3', 'mike_wilson', 'Mike Wilson', '2024-01-12 09:15:00', 'QUALIFIED'),
('test_customer_4', 'emma_davis', 'Emma Davis', '2024-01-13 16:45:00', 'PROPOSAL'),
('test_customer_5', 'alex_brown', 'Alex Brown', '2024-01-14 11:20:00', 'CLOSED_WON');

-- Додавання тестових повідомлень
INSERT INTO messages (lead_id, text, direction, timestamp) VALUES
-- Conversation 1
(1, 'Hi! I\'m interested in your services', 'inbound', '2024-01-10 10:05:00'),
(1, 'Hello John! Thank you for your interest. How can I help you?', 'outbound', '2024-01-10 10:10:00'),
(1, 'I need more information about pricing', 'inbound', '2024-01-10 10:15:00'),
(1, 'I\'ll send you our pricing details right away!', 'outbound', '2024-01-10 10:20:00'),

-- Conversation 2
(2, 'Hello, do you offer custom solutions?', 'inbound', '2024-01-11 14:35:00'),
(2, 'Yes, we specialize in custom solutions! What are your specific needs?', 'outbound', '2024-01-11 14:40:00'),
(2, 'I need a solution for my e-commerce business', 'inbound', '2024-01-11 14:45:00'),
(2, 'Perfect! Let me schedule a consultation call with you.', 'outbound', '2024-01-11 14:50:00'),

-- Conversation 3
(3, 'Can you help with Instagram marketing?', 'inbound', '2024-01-12 09:20:00'),
(3, 'Absolutely! We offer comprehensive Instagram marketing services.', 'outbound', '2024-01-12 09:25:00'),
(3, 'What\'s included in your marketing package?', 'inbound', '2024-01-12 09:30:00'),
(3, 'Content creation, posting schedule, analytics, and growth strategies.', 'outbound', '2024-01-12 09:35:00'),
(3, 'Sounds great! When can we start?', 'inbound', '2024-01-12 09:40:00'),

-- Conversation 4
(4, 'I received your proposal. Looks interesting!', 'inbound', '2024-01-13 16:50:00'),
(4, 'Thank you Emma! Do you have any questions about the proposal?', 'outbound', '2024-01-13 16:55:00'),
(4, 'Yes, can we discuss the timeline?', 'inbound', '2024-01-13 17:00:00'),
(4, 'Of course! The project would take 4-6 weeks to complete.', 'outbound', '2024-01-13 17:05:00'),

-- Conversation 5
(5, 'Ready to move forward with the project!', 'inbound', '2024-01-14 11:25:00'),
(5, 'Excellent Alex! I\'ll send you the contract details.', 'outbound', '2024-01-14 11:30:00'),
(5, 'Perfect, looking forward to working together!', 'inbound', '2024-01-14 11:35:00'),
(5, 'Welcome aboard! We\'ll start next Monday.', 'outbound', '2024-01-14 11:40:00');
```

## 🔧 Налаштування для App Review

### Environment Variables для тестування:
```bash
# Основні налаштування
NODE_ENV=production
PORT=3000

# Instagram API
PAGE_ACCESS_TOKEN=your_test_page_access_token
VERIFY_TOKEN=director_verify_test
OWN_INSTAGRAM_ID=your_business_instagram_id

# Database
DATABASE_URL=your_production_database_url

# Business Info
BUSINESS_EMAIL=support@director-admin.com
PRIVACY_POLICY_URL=https://director-webhook-1.onrender.com/privacy
TERMS_URL=https://director-webhook-1.onrender.com/terms
```

### Webhook URL для Meta Developer Console:
```
https://director-webhook-1.onrender.com/webhook
```

## 🎬 Screencast Scenarios

### Scenario 1: Receiving Messages (2-3 minutes)
1. Show empty leads list
2. Send message from @director_test_customer to @director_test_business
3. Refresh admin panel - show new lead appears
4. Click on lead to view conversation
5. Show message details and profile information

### Scenario 2: Sending Messages (3-4 minutes)  
1. Open conversation with existing lead
2. Type response message in chat interface
3. Click send button
4. Show message appears in conversation
5. Verify message received in Instagram app (show both screens)
6. Show message status indicators

### Scenario 3: Lead Management (2-3 minutes)
1. Navigate to leads list
2. Show different lead statuses (NEW, CONTACTED, etc.)
3. Update lead status from dropdown
4. Show status change reflected in list
5. Demonstrate search/filter functionality

### Scenario 4: Message History Sync (2 minutes)
1. Open conversation
2. Click sync button (refresh icon)
3. Show loading state
4. Display newly synced messages
5. Show complete conversation history

## 🧪 Testing Checklist for Reviewers

### ✅ Basic Functionality
- [ ] Webhook receives Instagram messages
- [ ] New leads are created automatically  
- [ ] Messages are stored in database
- [ ] Profile information is fetched and displayed
- [ ] Message sending works through admin panel
- [ ] Conversation history is maintained

### ✅ Lead Management
- [ ] Leads list displays correctly
- [ ] Lead status can be updated
- [ ] Search functionality works
- [ ] Lead details are accurate
- [ ] Status filtering works

### ✅ Chat Interface
- [ ] Messages display in correct order
- [ ] Inbound/outbound messages are distinguished
- [ ] Timestamps are shown correctly
- [ ] Message sending interface works
- [ ] Message history sync works

### ✅ API Integration  
- [ ] Instagram Graph API calls work
- [ ] Webhook validation works
- [ ] Error handling is implemented
- [ ] Rate limiting is respected
- [ ] API responses are handled correctly

### ✅ Security & Privacy
- [ ] Privacy policy is accessible
- [ ] Terms of service are available
- [ ] Data is handled securely
- [ ] User consent is obtained
- [ ] Data can be deleted upon request

## 🚨 Common Issues and Solutions

### Issue: Messages not appearing
**Solution:** Check webhook URL configuration and verify token

### Issue: API calls failing  
**Solution:** Verify PAGE_ACCESS_TOKEN is valid and has correct permissions

### Issue: Database connection errors
**Solution:** Check DATABASE_URL and ensure database is accessible

### Issue: Profile information not loading
**Solution:** Ensure Instagram Business account is properly connected

## 📞 Support for Reviewers

If Meta reviewers encounter any issues during testing:

1. **Email:** support@director-admin.com
2. **Response Time:** Within 4 hours during business days
3. **Include:** Detailed description of issue and steps to reproduce
4. **We provide:** 
   - Test account credentials if needed
   - Technical support during review process
   - Additional documentation if required

## 🎯 Success Metrics

The app should demonstrate:
- ✅ 100% webhook message reception
- ✅ <2 second response time for message sending
- ✅ Accurate profile data retrieval
- ✅ Persistent conversation history
- ✅ Reliable lead management functionality
- ✅ Proper error handling and user feedback 