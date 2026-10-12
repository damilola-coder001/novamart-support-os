// NovaMart - Mock Email Automation Engine
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity/logger";

export type EmailTemplateType =
  | "TICKET_CREATED"
  | "RETURN_SUBMITTED"
  | "RETURN_APPROVED"
  | "REFUND_INITIATED"
  | "AGENT_REPLY"
  | "ISSUE_RESOLVED";

interface SendEmailParams {
  customerId?: string | null;
  recipientEmail: string;
  recipientName: string;
  templateType: EmailTemplateType;
  subject: string;
  metadata?: Record<string, any>;
}

export async function sendAutomatedEmail(params: SendEmailParams) {
  // Check customer email preferences if customerId provided
  if (params.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      select: { emailNotifications: true },
    });

    if (customer && !customer.emailNotifications) {
      console.log(`[Email Service] Skipped email to ${params.recipientEmail} - customer opted out of email updates.`);
      return null;
    }
  }

  // Generate HTML content based on template
  const { html, preview } = generateEmailTemplate(params);

  // Record Email Event in database
  const emailRecord = await prisma.emailEvent.create({
    data: {
      customerId: params.customerId || null,
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      templateType: params.templateType,
      contentPreview: preview,
      htmlContent: html,
      status: "SENT",
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });

  // Log activity for Admin Timeline
  await logActivity({
    actorType: "SYSTEM",
    actorName: "NovaMart Email Service",
    action: "EMAIL_SENT",
    entityType: "EmailEvent",
    entityId: emailRecord.id,
    details: {
      recipient: params.recipientEmail,
      template: params.templateType,
      subject: params.subject,
    },
  });

  return emailRecord;
}

function generateEmailTemplate(params: SendEmailParams): { html: string; preview: string } {
  const { recipientName, templateType, metadata = {} } = params;

  switch (templateType) {
    case "TICKET_CREATED": {
      const ticketNumber = metadata.ticketNumber || "TCK-8000";
      const category = metadata.category || "General Support";
      const priority = metadata.priority || "Medium";
      const preview = `Your support ticket [${ticketNumber}] has been opened regarding ${category}. Priority: ${priority}.`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #4f46e5; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">NovaMart Support</h1>
            <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 14px;">Customer Care & Resolution Center</p>
          </div>
          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${recipientName}</strong>,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              A new support ticket has been created for your recent request. Our team has received your details and is actively working on it.
            </p>
            <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin: 0 0 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;"><strong>Ticket Number:</strong> <span style="color: #0f172a;">${ticketNumber}</span></p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;"><strong>Category:</strong> <span style="color: #0f172a;">${category}</span></p>
              <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Priority:</strong> <span style="color: ${priority === "URGENT" ? "#dc2626" : "#4f46e5"}; font-weight: 600;">${priority}</span></p>
            </div>
            <p style="font-size: 14px; color: #64748b; margin: 0 0 24px 0;">
              You can track or reply to this request directly in your NovaMart Customer Portal at any time.
            </p>
            <div style="text-align: center;">
              <a href="#" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">View Support Portal</a>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} NovaMart Inc. All rights reserved. You received this email because you opted into notifications.</p>
          </div>
        </div>
      `;
      return { html, preview };
    }

    case "RETURN_APPROVED": {
      const returnNumber = metadata.returnNumber || "RET-1001";
      const orderNumber = metadata.orderNumber || "ORD-9821";
      const refundAmount = metadata.refundAmount ? `$${metadata.refundAmount}` : "$179.99";
      const trackingNumber = metadata.trackingNumber || "RET-FDX-998811";
      const preview = `Your return request ${returnNumber} for order ${orderNumber} has been approved. Prepaid label attached.`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #059669; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Return Request Approved</h1>
            <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 14px;">Prepaid Shipping Label Generated</p>
          </div>
          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${recipientName}</strong>,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              Good news! Your return request <strong>${returnNumber}</strong> for order <strong>${orderNumber}</strong> has been officially approved.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 8px; margin: 0 0 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;"><strong>Estimated Refund Amount:</strong> ${refundAmount}</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;"><strong>Carrier:</strong> FedEx Express</p>
              <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Prepaid Return Tracking:</strong> ${trackingNumber}</p>
            </div>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0;">
              Please print your prepaid label from your account, package the item with original accessories, and drop it off at any FedEx drop box or retail store.
            </p>
            <div style="text-align: center;">
              <a href="#" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Download Return Label</a>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} NovaMart Inc. All rights reserved.</p>
          </div>
        </div>
      `;
      return { html, preview };
    }

    case "REFUND_INITIATED": {
      const refundAmount = metadata.refundAmount ? `$${metadata.refundAmount}` : "$189.99";
      const orderNumber = metadata.orderNumber || "ORD-7734";
      const preview = `A refund of ${refundAmount} has been initiated for order ${orderNumber}.`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #2563eb; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Refund Initiated</h1>
            <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 14px;">NovaMart Payment Operations</p>
          </div>
          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${recipientName}</strong>,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              We have processed a refund of <strong>${refundAmount}</strong> to your original payment method for order <strong>${orderNumber}</strong>.
            </p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0;">
              Credit card refunds typically reflect on your bank statement within 3-5 business days depending on your financial institution.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} NovaMart Inc. All rights reserved.</p>
          </div>
        </div>
      `;
      return { html, preview };
    }

    case "AGENT_REPLY": {
      const agentName = metadata.agentName || "Alex Rivera";
      const messagePreview = metadata.messagePreview || "We have reviewed your request and made the requested changes.";
      const preview = `${agentName} from NovaMart Support replied to your conversation.`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #4f46e5; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">New Support Message</h1>
            <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 14px;">Response from ${agentName}</p>
          </div>
          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${recipientName}</strong>,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              Our support specialist <strong>${agentName}</strong> sent a response to your inquiry:
            </p>
            <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 18px; border-radius: 6px; margin: 0 0 24px 0; font-style: italic; color: #334155;">
              "${messagePreview}"
            </div>
            <div style="text-align: center;">
              <a href="#" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Continue Conversation</a>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} NovaMart Inc. All rights reserved.</p>
          </div>
        </div>
      `;
      return { html, preview };
    }

    case "ISSUE_RESOLVED": {
      const ticketNumber = metadata.ticketNumber || "TCK-8803";
      const preview = `Your support issue [${ticketNumber}] has been resolved. Please rate your experience.`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #059669; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Issue Resolved</h1>
            <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 14px;">Ticket ${ticketNumber} Closed</p>
          </div>
          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${recipientName}</strong>,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              Your support inquiry has been successfully resolved. We hope you had a great experience with our team!
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 0 0 24px 0;">
              Please let us know how we did by providing quick feedback in your customer portal.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} NovaMart Inc. All rights reserved.</p>
          </div>
        </div>
      `;
      return { html, preview };
    }

    default: {
      const preview = `Update on your NovaMart support request.`;
      const html = `<div><p>Hello ${recipientName}, update on your support request.</p></div>`;
      return { html, preview };
    }
  }
}
