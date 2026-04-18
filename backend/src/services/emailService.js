import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    requireTLS: true, 
    tls: {
    rejectUnauthorized: false
  }
});

export const sendPasswordResetEmail = async (email, otp) => {
    const mailOptions = {
        from: `"TimPhongOnline" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Mã xác nhận khôi phục mật khẩu - TimPhongOnline',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f43f5e; margin: 0;">TimPhongTro</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Hệ thống Tìm Phòng Trọ Nhanh Chóng</p>
                </div>
                
                <div style="background-color: white; padding: 30px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #0f172a; margin-top: 0;">Khôi phục mật khẩu</h2>
                    <p style="color: #334155; line-height: 1.6;">
                        Bạn vừa yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này. 
                        Vui lòng sử dụng mã xác nhận (OTP) gồm 6 chữ số dưới đây để tiếp tục. Mã này sẽ hết hạn sau <strong>10 phút</strong>.
                    </p>
                    
                    <div style="margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f43f5e; background-color: #ffe4e6; padding: 15px 30px; border-radius: 8px;">
                            ${otp}
                        </span>
                    </div>
                    
                    <p style="color: #64748b; font-size: 13px; margin-top: 30px;">
                        Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này. Khuyến cáo không chia sẻ mã này với bất kỳ ai.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} TimPhongOnline. All rights reserved.
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] OTP sent to ${email}`);
    } catch (error) {
        console.error(`[Email Service] Error sending to ${email}:`, error);
        throw new Error('Không thể gửi email lúc này. Vui lòng thử lại sau.');
    }
};
