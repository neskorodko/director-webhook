# Instagram App Review Submission Guide

## 📋 Pre-Submission Checklist

### ✅ Required Documents
- [x] Privacy Policy (PRIVACY_POLICY.md)
- [x] Terms of Service (TERMS_OF_SERVICE.md)
- [ ] App Icon (1024x1024 pixels)
- [ ] Business Email configured
- [ ] Privacy Policy URL hosted publicly

### ✅ Technical Requirements
- [x] Webhook endpoint working
- [x] Message sending functionality
- [x] Message receiving functionality
- [x] Lead management system
- [x] Error handling implemented
- [x] HTTPS/SSL configured

## 🎯 Permissions to Request

### Instagram Business Login API
- `instagram_business_basic` - Access basic profile information
- `instagram_business_manage_messages` - Send and receive messages

### Required Features
- Human Agent feature (for customer support)

## 📝 App Review Submission Details

### 1. App Settings
```
App Name: Director Admin Panel
App Category: Business
Business Email: support@director-admin.com
Privacy Policy URL: https://director-webhook-1.onrender.com/privacy
Terms of Service URL: https://director-webhook-1.onrender.com/terms
App Icon: [Upload 1024x1024 PNG]
```

### 2. Platform Settings
**Platform:** Web Application
**URL:** https://director-webhook-1.onrender.com

**Detailed Instructions for Reviewers:**
```
1. Access the admin panel at https://director-webhook-1.onrender.com
2. Use test credentials (if required):
   - Username: [test_user]
   - Password: [test_password]
3. Navigate to "Ліди" (Leads) section
4. Select any lead to view conversation
5. Test sending a message using the chat interface
6. Verify message appears in conversation history
7. Test lead status updates in the lead management section
8. Check message synchronization feature by clicking refresh button
```

### 3. Use Case Descriptions

#### instagram_business_basic
**How your app uses this permission:**
```
Our app uses instagram_business_basic to:
- Retrieve basic profile information (username, name) of Instagram users who message our business clients
- Display lead information in our admin panel for customer identification
- Maintain accurate customer records for business communication purposes

This permission is essential for lead management and customer identification in business conversations.
```

#### instagram_business_manage_messages
**How your app uses this permission:**
```
Our app uses instagram_business_manage_messages to:
- Receive incoming messages from customers via webhook notifications
- Send responses to customer inquiries through our admin panel interface
- Maintain conversation history for customer support purposes
- Enable businesses to manage customer communications efficiently

This permission is core to our business messaging functionality, allowing companies to provide customer support through Instagram Direct messages.
```

#### Human Agent Feature
**How your app uses this feature:**
```
Our app implements Human Agent functionality to:
- Allow human customer service representatives to respond to customer messages
- Provide a dashboard interface for agents to manage multiple conversations
- Track conversation status and lead progression
- Ensure compliance with Instagram's messaging policies by having human oversight

All messages are reviewed and sent by human agents through our interface, ensuring personalized customer service.
```

## 🎬 Screencast Requirements

### Screencast 1: instagram_business_basic
**Duration:** 2-3 minutes
**Content:**
1. Login to admin panel
2. Navigate to Leads section
3. Show how profile information is displayed
4. Demonstrate lead identification using profile data
5. Show privacy controls and data handling

### Screencast 2: instagram_business_manage_messages
**Duration:** 3-4 minutes
**Content:**
1. Show incoming message notification
2. Navigate to chat interface
3. Demonstrate sending a response message
4. Show message history and conversation flow
5. Display message status indicators

### Screencast 3: Human Agent Feature
**Duration:** 2-3 minutes
**Content:**
1. Show agent dashboard interface
2. Demonstrate human agent selecting and responding to messages
3. Show conversation management features
4. Display agent oversight and control mechanisms

## 📋 Testing Instructions for Meta Reviewers

### Test Account Setup
```
Instagram Business Account: @director_test_business
Facebook Page: Director Test Business
Test Customer Account: @director_test_customer
```

### Test Scenarios

#### Scenario 1: Receiving Messages
1. Send a message from test customer account to business account
2. Verify webhook receives the message
3. Check message appears in admin panel
4. Confirm lead is created automatically

#### Scenario 2: Sending Messages
1. Access admin panel
2. Select a conversation
3. Type and send a response message
4. Verify message appears in Instagram app
5. Check message status indicators

#### Scenario 3: Lead Management
1. View leads list in admin panel
2. Update lead status
3. Add notes or tags to lead
4. Verify data persistence

#### Scenario 4: Message History Sync
1. Click sync button in chat interface
2. Verify historical messages are loaded
3. Check message order and formatting

## 🔒 Security and Compliance

### Data Handling
- All data encrypted in transit (HTTPS/TLS)
- Database access restricted and secured
- No data sharing with third parties
- User consent required for data processing

### API Compliance
- Webhook verification implemented
- Rate limiting respected
- Error handling for API failures
- Proper token management

### Privacy Controls
- Users can revoke access anytime
- Data deletion upon request
- Clear privacy policy
- Transparent data usage

## 📞 Support Information

### Contact Details
- **Technical Support:** support@director-admin.com
- **Privacy Questions:** privacy@director-admin.com
- **Business Inquiries:** business@director-admin.com

### Response Times
- Critical Issues: 4 hours
- General Support: 24 hours
- Privacy Requests: 30 days

## 🚀 Post-Approval Steps

1. **Production Deployment**
   - Ensure all systems are production-ready
   - Monitor API usage and performance
   - Set up error monitoring and alerting

2. **User Onboarding**
   - Create user documentation
   - Provide training materials
   - Set up customer support processes

3. **Compliance Monitoring**
   - Regular privacy policy reviews
   - API usage monitoring
   - Security audit schedule

## ⚠️ Common Rejection Reasons to Avoid

1. **Insufficient Documentation**
   - Provide detailed use case descriptions
   - Include comprehensive testing instructions
   - Ensure screencasts show all functionality

2. **Privacy Policy Issues**
   - Must be publicly accessible
   - Must cover all data collection
   - Must include user rights information

3. **Functionality Not Demonstrated**
   - Ensure all requested permissions are shown in use
   - Provide working test accounts
   - Make functionality easily discoverable

4. **Non-Compliance with Policies**
   - Review Instagram Platform Policy
   - Ensure business use case alignment
   - Avoid prohibited use cases

## 📅 Timeline Expectations

- **Submission Preparation:** 1-2 weeks
- **Meta Review Process:** 2-4 weeks
- **Revision Time (if needed):** 1 week
- **Total Timeline:** 4-7 weeks

Remember: Be thorough, transparent, and ensure all functionality works perfectly before submission! 