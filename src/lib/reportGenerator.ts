import { Message } from '../types';
import { format } from 'date-fns';

interface ChatReport {
  title: string;
  timestamp: string;
  messages: Message[];
  stats: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    attachments: number;
    averageResponseTime: string;
    totalDuration: string;
  };
}

export function generateChatReport(messages: Message[], title: string): ChatReport {
  const timestamps = messages.map(m => new Date(m.timestamp));
  const startTime = Math.min(...timestamps.map(t => t.getTime()));
  const endTime = Math.max(...timestamps.map(t => t.getTime()));
  const duration = endTime - startTime;

  // Calculate response times between user and assistant messages
  let totalResponseTime = 0;
  let responsePairs = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
      const responseTime = new Date(messages[i + 1].timestamp).getTime() - new Date(messages[i].timestamp).getTime();
      totalResponseTime += responseTime;
      responsePairs++;
    }
  }

  const stats = {
    totalMessages: messages.length,
    userMessages: messages.filter(m => m.role === 'user').length,
    assistantMessages: messages.filter(m => m.role === 'assistant').length,
    attachments: messages.filter(m => m.attachment).length,
    averageResponseTime: formatDuration(responsePairs ? totalResponseTime / responsePairs : 0),
    totalDuration: formatDuration(duration),
  };

  return {
    title,
    timestamp: format(new Date(), 'PPpp'),
    messages,
    stats,
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function generateHTML(report: ChatReport): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat Report - ${report.title}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                background: #f7f7f7;
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 2rem;
                padding: 2rem;
                background: #fff;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
                padding: 1rem;
                background: #fff;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-item {
                padding: 1rem;
                text-align: center;
                border: 1px solid #eee;
                border-radius: 5px;
            }
            .stat-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: #2563eb;
            }
            .messages {
                background: #fff;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .message {
                margin-bottom: 1.5rem;
                padding: 1rem;
                border-radius: 5px;
            }
            .message.user {
                background: #f0f9ff;
                margin-left: 2rem;
            }
            .message.assistant {
                background: #f0fdf4;
                margin-right: 2rem;
            }
            .message-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                color: #666;
            }
            .message-content {
                white-space: pre-wrap;
            }
            .attachment {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                font-size: 0.875rem;
            }
            .footer {
                text-align: center;
                margin-top: 2rem;
                padding: 1rem;
                color: #666;
                font-size: 0.875rem;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${report.title}</h1>
            <p>Generated on ${report.timestamp}</p>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">${report.stats.totalMessages}</div>
                <div>Total Messages</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.stats.userMessages}</div>
                <div>User Messages</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.stats.assistantMessages}</div>
                <div>Assistant Messages</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.stats.attachments}</div>
                <div>Attachments</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.stats.averageResponseTime}</div>
                <div>Avg. Response Time</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.stats.totalDuration}</div>
                <div>Total Duration</div>
            </div>
        </div>

        <div class="messages">
            ${report.messages.map(message => `
                <div class="message ${message.role}">
                    <div class="message-header">
                        <span>${message.role === 'user' ? 'User' : 'Assistant'}</span>
                        <span>${format(new Date(message.timestamp), 'PPpp')}</span>
                    </div>
                    <div class="message-content">${message.content}</div>
                    ${message.attachment ? `
                        <div class="attachment">
                            📎 Attachment: ${message.attachment.name} (${Math.round(message.attachment.size / 1024)}KB)
                            <br>
                            <a href="${message.attachment.url}" target="_blank">Download</a>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Generated by MindfulAI Chat</p>
        </div>
    </body>
    </html>
  `;
}

export function downloadReport(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 