import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from root directory
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Lazy nodemailer transporter creation
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return null;
}

// Contact form API endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, service, message } = req.body;

    // Server-side validation
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez remplir tous les champs obligatoires (Prénom, Nom, E-mail, Message).'
      });
    }

    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || 'salomonkatula2@gmail.com';
    const cleanFirstName = String(firstName).trim();
    const cleanLastName = String(lastName).trim();
    const cleanEmail = String(email).trim();
    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanService = service ? String(service).trim() : 'Général / Non précisé';
    const cleanMessage = String(message).trim();

    const entry = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      recipient,
      sender: {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        fullName: `${cleanFirstName} ${cleanLastName}`,
        email: cleanEmail,
        phone: cleanPhone
      },
      service: cleanService,
      message: cleanMessage
    };

    // Save inquiry to persistent JSON log
    try {
      const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
      const current = raw ? JSON.parse(raw) : [];
      current.unshift(entry);
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(current, null, 2), 'utf8');
    } catch (fsErr) {
      console.error('[Contact Form] Erreur sauvegarde locale:', fsErr);
    }

    console.log(`[Contact Form] Nouveau message de ${entry.sender.fullName} (${entry.sender.email}) destiné à ${recipient}`);
    console.log(`Service: ${entry.service} | Téléphone: ${entry.sender.phone}`);
    console.log(`Message: ${entry.message}`);

    let emailDispatched = false;
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Portfolio Salomon Katula" <${process.env.SMTP_USER}>`,
          to: recipient,
          replyTo: entry.sender.email,
          subject: `[Message Portfolio] ${entry.sender.fullName} - ${entry.service}`,
          text: `Nouveau message reçu depuis le site portfolio :\n\nNom: ${entry.sender.fullName}\nEmail: ${entry.sender.email}\nTéléphone: ${entry.sender.phone || 'Non renseigné'}\nService: ${entry.service}\n\nMessage:\n${entry.message}\n\nDate: ${new Date().toLocaleString('fr-FR')}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 24px; border-radius: 8px; border: 1px solid #e2e2e2;">
              <h2 style="color: #d11212; margin-top: 0;">Nouveau message de contact</h2>
              <p style="font-size: 15px; color: #333;"><strong>Expéditeur :</strong> ${entry.sender.fullName}</p>
              <p style="font-size: 15px; color: #333;"><strong>E-mail :</strong> <a href="mailto:${entry.sender.email}">${entry.sender.email}</a></p>
              <p style="font-size: 15px; color: #333;"><strong>Téléphone :</strong> ${entry.sender.phone || 'Non renseigné'}</p>
              <p style="font-size: 15px; color: #333;"><strong>Service :</strong> ${entry.service}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <h3 style="color: #111; margin-bottom: 8px;">Message :</h3>
              <p style="font-size: 15px; line-height: 1.6; color: #222; background-color: #fff; padding: 16px; border-radius: 6px; border-left: 4px solid #d11212; white-space: pre-wrap;">${entry.message}</p>
              <p style="font-size: 12px; color: #888; margin-top: 24px;">Message reçu le ${new Date().toLocaleString('fr-FR')} via le formulaire de contact du portfolio.</p>
            </div>
          `
        });
        emailDispatched = true;
        console.log(`[Contact Form] E-mail SMTP envoyé avec succès à ${recipient}`);
      } catch (mailErr) {
        console.error('[Contact Form] Erreur envoi SMTP:', mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Votre message a bien été envoyé avec succès !',
      recipient,
      emailDispatched,
      data: {
        fullName: entry.sender.fullName,
        email: entry.sender.email,
        phone: entry.sender.phone,
        service: entry.service,
        message: entry.message
      }
    });
  } catch (err) {
    console.error('Server error in /api/contact:', err);
    return res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de l\'envoi du message.'
    });
  }
});

// SPA fallback for HTML navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
