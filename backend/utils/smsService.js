const axios = require('axios');

// Configuration with better error handling
const SMS_CONFIG = {
    API_KEY: process.env.SMS_API_KEY,
    API_URL: process.env.SMS_API_URL,
    SENDER_ID: process.env.SMS_SENDER_ID,
    TEMPLATE_ID: process.env.SMS_TEMPLATE_ID,
    TEST_MODE: process.env.SMS_TEST_MODE === 'true'
};

// Enhanced SMS sending function with detailed logging
const sendOrderDeliverySMS = async (phoneNumber, orderDetails) => {
    // Validate inputs
    if (!phoneNumber || !orderDetails?._id) {
        throw new Error('Phone number and order details are required');
    }

    // Initial logging
    console.log('\n=== SMS Delivery Attempt ===');
    console.log(`📱 Target Phone Number: ${phoneNumber}`);
    console.log(`📋 Order ID: ${orderDetails._id}`);
    console.log(`💰 Total Amount: ₹${orderDetails.totalAmount}`);
    console.log('============================');

    try {
        const orderLink = `${process.env.FRONTEND_URL}/order/${orderDetails._id}`;
        
        // Format message with order details
        const message = `DUE TO TECHNICAL PROBLEM WITH ${orderDetails._id} STUDENTS ARE ADVISED NOT TO PAY THEIR FEE ONLINE FROM-${orderDetails.totalAmount}. ONWARDS.ONLY PAY CASH AT COLLEGE CASH COUNTER-PRINCIPAL PYDAH`;

        const params = {
            apikey: SMS_CONFIG.API_KEY,
            sender: SMS_CONFIG.SENDER_ID,
            number: phoneNumber,
            message: message,
            templateid: SMS_CONFIG.TEMPLATE_ID,
        };

        console.log('Sending SMS with params:', {
            sender: params.sender,
            number: params.number,
            templateId: params.templateid
        });

        const response = await axios.get(SMS_CONFIG.API_URL, { params });

        // Success logging
        console.log('\n=== SMS Delivery Status ===');
        console.log('✅ SMS sent successfully');
        console.log(`📱 Delivered to: ${phoneNumber}`);
        console.log(`🆔 Order: ${orderDetails._id}`);
        console.log('API Response:', response.data);
        console.log('==========================');

        return { success: true, response: response.data };
    } catch (error) {
        // Error logging
        console.error('\n=== SMS Delivery Failed ===');
        console.error(`❌ Failed to send SMS to: ${phoneNumber}`);
        console.error(`🆔 Order: ${orderDetails._id}`);
        console.error('Error:', error.message);
        console.error('==========================');
        throw error;
    }
};

module.exports = {
    sendOrderDeliverySMS
};