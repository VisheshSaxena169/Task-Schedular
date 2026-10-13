const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendRoleAssignmentEmail = async (userEmail, workspaceName, role) => {
    try {
        const mailOptions = {
            from: `"TaskFlow Workspace" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `You have been added to ${workspaceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                    <h2>Welcome to ${workspaceName}!</h2>
                    <p>The workspace owner has just added you to their workspace.</p>
                    <p><strong>Your Role:</strong> ${role.toUpperCase()}</p>
                    <p>Login to your account to view your new workspace and start collaborating.</p>
                    <a href="http://localhost:5173" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                        Go to Dashboard
                    </a>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${userEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("❌ Email sending failed:", error);
        return false;
    }
};

module.exports = {
    sendRoleAssignmentEmail
};