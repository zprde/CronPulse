import type { Env, Alert } from './types';

/**
 * Telegram notification service
 */
export class TelegramNotifier {
    private botToken: string;
    private chatId: string;

    constructor(botToken: string, chatId: string) {
        this.botToken = botToken;
        this.chatId = chatId;
    }

    /**
     * Send alert notification to Telegram
     */
    async sendAlert(alert: Alert): Promise<boolean> {
        const message = this.formatAlertMessage(alert);

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${this.botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: this.chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                }
            );

            if (!response.ok) {
                console.error('Telegram API error:', await response.text());
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to send Telegram notification:', error);
            return false;
        }
    }

    /**
     * Format alert message for Telegram
     */
    private formatAlertMessage(alert: Alert): string {
        const severityEmoji = alert.severity === 'critical' ? '🔴' : '⚠️';
        const timestamp = new Date(alert.timestamp).toLocaleString('en-US', {
            timeZone: 'Asia/Shanghai',
        });

        return `${severityEmoji} <b>CronPulse Alert</b>

<b>Job:</b> ${alert.jobName}
<b>Type:</b> ${alert.type.replace('_', ' ')}
<b>Severity:</b> ${alert.severity.toUpperCase()}
<b>Time:</b> ${timestamp}

<b>Message:</b> ${alert.message}`;
    }
    /**
     * Send test message to Telegram
     */
    async sendTestMessage(jobName: string): Promise<boolean> {
        const message = `🧪 <b>CronPulse Test Alert</b>

This is a test notification for job: <b>${jobName}</b>

If you are seeing this, your Telegram integration is working correctly!`;

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${this.botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: this.chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                }
            );

            if (!response.ok) {
                console.error('Telegram API error:', await response.text());
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to send Telegram test message:', error);
            return false;
        }
    }
    /**
     * Send recovery notification to Telegram
     */
    async sendRecovery(jobName: string, downtimeDuration: string): Promise<boolean> {
        const message = `🟢 <b>CronPulse Recovery</b>

<b>Job:</b> ${jobName}
<b>Status:</b> RECOVERED
<b>Downtime:</b> ${downtimeDuration}

The job is now running correctly.`;

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${this.botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: this.chatId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                }
            );

            if (!response.ok) {
                console.error('Telegram API error:', await response.text());
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to send Telegram recovery message:', error);
            return false;
        }
    }
}

/**
 * Create Telegram notifier from environment
 */
export function createTelegramNotifier(env: Env): TelegramNotifier | null {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        console.warn(
            'Telegram credentials not configured. Alerts will only be logged.'
        );
        return null;
    }

    return new TelegramNotifier(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
}
