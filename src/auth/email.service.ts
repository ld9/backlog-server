import { User } from "./user.interface";
import nodemailer from "nodemailer";
import { createNewToken } from "./user.service";

import * as dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'mail.lynch.dev',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASS
    }
})

export const sendWelcomeEmail = async (user: User): Promise<boolean> => {

    const naConfirmToken = await createNewToken(user.auth.email, 'confirm-account', undefined, (1000 * 60 * 60 * 24 * 21));

    const mail = await transporter.sendMail({
        from: process.env.EMAILUSER,
        to: user.auth.email.toString(),
        subject: 'Backlog Account Created',
        html: `
            <div style='margin: 48px; text-align: center;'>
                <h3>Welcome to Backlog, ${user.name.first}!</h3>
                <p>Thank you for creating an account with the backlog media system. You'll be able to use the system once an administrator assigns permissions to you.</p>
                <p>Please confirm that this email belongs to you by <a href='${process.env.DOCUMENTROOT}/user/verify/${naConfirmToken.token}'>clicking here</a>. Thank you!</p>
            </div>
        `
    });

    return mail.accepted.length > 0;
}

export const sendResetPasswordEmail = async (user: User): Promise<void> => {
    const prConfirmToken = await createNewToken(user.auth.email, 'reset-password', undefined, (1000 * 60 * 15));

    const mail = await transporter.sendMail({
        from: process.env.EMAILUSER,
        to: user.auth.email.toString(),
        subject: 'Backlog Password Reset Request',
        html: `
            <div style='margin: 48px; text-align: center;'>
                <h3>Password Reset Request for ${user.name.first}.</h3>
                <p>If you requested that your password be reset, please use the link below to continue the password reset process. If you did not, you can ignore this message.</p>
                <p>Please confirm that this email belongs to you, and that you wish to reset your password by <a href='${process.env.DOCUMENTROOT}/user/passwordreset/${prConfirmToken.token}'>clicking here</a>. Thank you!</p>
            </div>
        `
    });

    return;
}

export const sendPasswordUpdatedEmail = async (user: User): Promise<void> => {
    
    const mail = await transporter.sendMail({
        from: process.env.EMAILUSER,
        to: user.auth.email.toString(),
        subject: 'Backlog Password Updated',
        html: `
            <div style='margin: 48px; text-align: center;'>
                <h3>${user.name.first}, your Backlog password has been reset.</h3>
                <p>If you did not authorize this action, please contact the administrator.</p>
            </div>
        `
    });

    return;
}