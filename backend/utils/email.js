const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
    // Generate plain-text from HTML by removing tags safely
    text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim(),
  };
  const info = await transporter.sendMail(mailOptions);
  return info;
};

const sendOrderConfirmationEmail = async (order, userEmail, userName) => {
  const itemsHtml = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">
            <img src="${item.image}" alt="${item.name}" width="60" style="border-radius:4px;"/>
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}${item.size ? ` (${item.size})` : ''}${item.color ? ` - ${item.color}` : ''}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${(item.price * item.qty).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Order Confirmation</title>
    </head>
    <body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="background:#8B1A4A;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">YashCollection</h1>
          <p style="color:#f5c6d8;margin:4px 0 0;">Ladies Kurti Collection</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#333;margin-top:0;">Order Confirmed! 🎉</h2>
          <p style="color:#555;">Dear ${userName},</p>
          <p style="color:#555;">Thank you for your order. We've received it and will begin processing shortly.</p>
          <div style="background:#f5f5f5;border-radius:6px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#333;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin:8px 0 0;color:#333;"><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:10px;text-align:left;color:#555;">Image</th>
                <th style="padding:10px;text-align:left;color:#555;">Item</th>
                <th style="padding:10px;text-align:center;color:#555;">Qty</th>
                <th style="padding:10px;text-align:right;color:#555;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align:right;border-top:2px solid #eee;padding-top:16px;">
            <p style="margin:4px 0;color:#555;">Subtotal: <strong>₹${order.itemsPrice.toFixed(2)}</strong></p>
            <p style="margin:4px 0;color:#555;">Shipping: <strong>₹${order.shippingPrice.toFixed(2)}</strong></p>
            <p style="margin:4px 0;color:#555;">Tax (GST): <strong>₹${order.taxPrice.toFixed(2)}</strong></p>
            <p style="margin:8px 0 0;font-size:18px;color:#8B1A4A;"><strong>Total: ₹${order.totalPrice.toFixed(2)}</strong></p>
          </div>
          <div style="margin-top:24px;padding:16px;background:#fff8fb;border-left:4px solid #8B1A4A;border-radius:4px;">
            <h3 style="margin:0 0 8px;color:#333;">Shipping Address</h3>
            <p style="margin:0;color:#555;">
              ${order.shippingAddress.fullName}<br/>
              ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br/>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
              ${order.shippingAddress.country}
            </p>
          </div>
          <p style="color:#555;margin-top:24px;">If you have any questions, reply to this email or contact us at support@yashcollection.com</p>
          <p style="color:#555;">Happy Shopping! 💕<br/><strong>Team YashCollection</strong></p>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;">
          <p style="margin:0;color:#999;font-size:12px;">© ${new Date().getFullYear()} YashCollection. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Order Confirmed - ${order.orderNumber} | YashCollection`,
    html,
  });
};

const sendPasswordResetEmail = async (userEmail, userName, resetUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="background:#8B1A4A;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;">YashCollection</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#333;">Reset Your Password</h2>
          <p style="color:#555;">Hi ${userName},</p>
          <p style="color:#555;">You requested a password reset. Click the button below to set a new password. This link expires in 10 minutes.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#8B1A4A;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;">Reset Password</a>
          </div>
          <p style="color:#999;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Or copy this link: ${resetUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Password Reset Request | YashCollection',
    html,
  });
};

module.exports = { sendEmail, sendOrderConfirmationEmail, sendPasswordResetEmail };
