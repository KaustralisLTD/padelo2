// Email templates for Staff notifications
// Based on the main email template structure from email-templates.ts

export interface StaffAccessGrantedEmailData {
  firstName: string;
  lastName?: string;
  tournamentName: string;
  permissions: {
    canManageGroups: boolean;
    canManageMatches: boolean;
    canViewRegistrations: boolean;
    canManageUsers: boolean;
    canManageLogs: boolean;
    canManageTournaments: boolean;
    canSendEmails: boolean;
  };
  adminPanelUrl: string;
  locale?: string;
}

const brandTaglines: Record<string, string> = {
  en: 'Breathe &amp; live padel',
  ru: 'Дыши и живи паделем',
  ua: 'Дихай та живи паделем',
  es: 'Respira y vive el pádel',
  fr: 'Respirez et vivez le padel',
  de: 'Atme und lebe Padel',
  it: 'Respira e vivi il padel',
  ca: 'Respira i viu el pàdel',
  nl: 'Adem en leef padel',
  da: 'Træk vejret og lev padel',
  sv: 'Andas och lev padel',
  no: 'Pust og lev padel',
  ar: 'تنفس وعِش البادل',
  zh: '呼吸并热爱壁板球',
};

const getBrandTagline = (locale: string) => brandTaglines[locale] || brandTaglines.en;

export function getStaffAccessGrantedEmailTemplate(data: StaffAccessGrantedEmailData): string {
  const { firstName, lastName, tournamentName, permissions, adminPanelUrl, locale = 'en' } = data;
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'Staff Member';
  const firstNameOnly = firstName || name.split(' ')[0] || 'Staff Member';

  // Build permissions list
  const permissionsList: string[] = [];
  if (permissions.canManageGroups) permissionsList.push('Manage Groups');
  if (permissions.canManageMatches) permissionsList.push('Manage Matches');
  if (permissions.canViewRegistrations) permissionsList.push('View Registrations');
  if (permissions.canManageUsers) permissionsList.push('Manage Users');
  if (permissions.canManageLogs) permissionsList.push('Manage Logs');
  if (permissions.canManageTournaments) permissionsList.push('Manage Tournaments');
  if (permissions.canSendEmails) permissionsList.push('Send Emails');

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Admin Access Granted - PadelO₂',
      greeting: 'Hello',
      message: 'You have been granted access to the PadelO₂ Admin Panel.',
      tournamentAccess: 'Tournament Access',
      tournamentName: 'Tournament',
      permissionsTitle: 'Your Permissions',
      permissionsDesc: 'You have been granted the following permissions for this tournament:',
      adminPanelButton: 'Go to Admin Panel',
      ifButtonDoesntWork: 'If the button doesn\'t work, paste this link into your browser:',
      footer: 'Welcome to the team!',
      team: 'PadelO₂ Team',
      receivingEmail: 'You\'re receiving this email because you were granted admin access on',
    },
    ru: {
      subject: 'Предоставлен доступ к админ-панели - PadelO₂',
      greeting: 'Здравствуйте',
      message: 'Вам предоставлен доступ к админ-панели PadelO₂.',
      tournamentAccess: 'Доступ к турниру',
      tournamentName: 'Турнир',
      permissionsTitle: 'Ваши разрешения',
      permissionsDesc: 'Вам предоставлены следующие разрешения для этого турнира:',
      adminPanelButton: 'Перейти в админ-панель',
      ifButtonDoesntWork: 'Если кнопка не работает, вставьте эту ссылку в браузер:',
      footer: 'Добро пожаловать в команду!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Вы получаете это письмо, потому что вам был предоставлен доступ к админ-панели на',
    },
    ua: {
      subject: 'Надано доступ до адмін-панелі - PadelO₂',
      greeting: 'Вітаємо',
      message: 'Вам надано доступ до адмін-панелі PadelO₂.',
      tournamentAccess: 'Доступ до турніру',
      tournamentName: 'Турнір',
      permissionsTitle: 'Ваші дозволи',
      permissionsDesc: 'Вам надано наступні дозволи для цього турніру:',
      adminPanelButton: 'Перейти до адмін-панелі',
      ifButtonDoesntWork: 'Якщо кнопка не працює, вставте це посилання в браузер:',
      footer: 'Ласкаво просимо до команди!',
      team: 'Команда PadelO₂',
      receivingEmail: 'Ви отримуєте цей лист, тому що вам було надано доступ до адмін-панелі на',
    },
    es: {
      subject: 'Acceso de administrador concedido - PadelO₂',
      greeting: 'Hola',
      message: 'Se te ha concedido acceso al Panel de Administración de PadelO₂.',
      tournamentAccess: 'Acceso al torneo',
      tournamentName: 'Torneo',
      permissionsTitle: 'Tus permisos',
      permissionsDesc: 'Se te han concedido los siguientes permisos para este torneo:',
      adminPanelButton: 'Ir al Panel de Administración',
      ifButtonDoesntWork: 'Si el botón no funciona, pega este enlace en tu navegador:',
      footer: '¡Bienvenido al equipo!',
      team: 'Equipo PadelO₂',
      receivingEmail: 'Estás recibiendo este correo porque se te concedió acceso de administrador en',
    },
    fr: {
      subject: 'Accès administrateur accordé - PadelO₂',
      greeting: 'Bonjour',
      message: 'Vous avez reçu l\'accès au Panneau d\'Administration de PadelO₂.',
      tournamentAccess: 'Accès au tournoi',
      tournamentName: 'Tournoi',
      permissionsTitle: 'Vos permissions',
      permissionsDesc: 'Vous avez reçu les permissions suivantes pour ce tournoi:',
      adminPanelButton: 'Aller au Panneau d\'Administration',
      ifButtonDoesntWork: 'Si le bouton ne fonctionne pas, collez ce lien dans votre navigateur:',
      footer: 'Bienvenue dans l\'équipe!',
      team: 'Équipe PadelO₂',
      receivingEmail: 'Vous recevez cet email car vous avez reçu l\'accès administrateur sur',
    },
    de: {
      subject: 'Administratorzugriff gewährt - PadelO₂',
      greeting: 'Hallo',
      message: 'Ihnen wurde Zugriff auf das PadelO₂ Admin-Panel gewährt.',
      tournamentAccess: 'Turnierzugriff',
      tournamentName: 'Turnier',
      permissionsTitle: 'Ihre Berechtigungen',
      permissionsDesc: 'Ihnen wurden die folgenden Berechtigungen für dieses Turnier gewährt:',
      adminPanelButton: 'Zum Admin-Panel gehen',
      ifButtonDoesntWork: 'Wenn der Button nicht funktioniert, fügen Sie diesen Link in Ihren Browser ein:',
      footer: 'Willkommen im Team!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Sie erhalten diese E-Mail, weil Ihnen Administratorzugriff gewährt wurde auf',
    },
    it: {
      subject: 'Accesso amministratore concesso - PadelO₂',
      greeting: 'Ciao',
      message: 'Ti è stato concesso l\'accesso al Pannello di Amministrazione di PadelO₂.',
      tournamentAccess: 'Accesso al torneo',
      tournamentName: 'Torneo',
      permissionsTitle: 'Le tue autorizzazioni',
      permissionsDesc: 'Ti sono state concesse le seguenti autorizzazioni per questo torneo:',
      adminPanelButton: 'Vai al Pannello di Amministrazione',
      ifButtonDoesntWork: 'Se il pulsante non funziona, incolla questo link nel tuo browser:',
      footer: 'Benvenuto nella squadra!',
      team: 'Team PadelO₂',
      receivingEmail: 'Stai ricevendo questa email perché ti è stato concesso l\'accesso amministratore su',
    },
    ca: {
      subject: 'Accés d\'administrador concedit - PadelO₂',
      greeting: 'Hola',
      message: 'Se t\'ha concedit accés al Panell d\'Administració de PadelO₂.',
      tournamentAccess: 'Accés al torneig',
      tournamentName: 'Torneig',
      permissionsTitle: 'Els teus permisos',
      permissionsDesc: 'Se t\'han concedit els següents permisos per a aquest torneig:',
      adminPanelButton: 'Anar al Panell d\'Administració',
      ifButtonDoesntWork: 'Si el botó no funciona, enganxa aquest enllaç al teu navegador:',
      footer: 'Benvingut a l\'equip!',
      team: 'Equip PadelO₂',
      receivingEmail: 'Estàs rebent aquest correu perquè se t\'ha concedit accés d\'administrador a',
    },
    nl: {
      subject: 'Beheerderstoegang verleend - PadelO₂',
      greeting: 'Hallo',
      message: 'Je hebt toegang gekregen tot het PadelO₂ Beheerpaneel.',
      tournamentAccess: 'Toernooitoegang',
      tournamentName: 'Toernooi',
      permissionsTitle: 'Je machtigingen',
      permissionsDesc: 'Je hebt de volgende machtigingen gekregen voor dit toernooi:',
      adminPanelButton: 'Ga naar Beheerpaneel',
      ifButtonDoesntWork: 'Als de knop niet werkt, plak deze link in je browser:',
      footer: 'Welkom bij het team!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Je ontvangt deze e-mail omdat je beheerderstoegang hebt gekregen op',
    },
    da: {
      subject: 'Administratortilgang tildelt - PadelO₂',
      greeting: 'Hej',
      message: 'Du har fået adgang til PadelO₂ Admin-panelet.',
      tournamentAccess: 'Turneringsadgang',
      tournamentName: 'Turnering',
      permissionsTitle: 'Dine tilladelser',
      permissionsDesc: 'Du har fået følgende tilladelser for denne turnering:',
      adminPanelButton: 'Gå til Admin-panel',
      ifButtonDoesntWork: 'Hvis knappen ikke virker, indsæt dette link i din browser:',
      footer: 'Velkommen til holdet!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du modtager denne e-mail, fordi du har fået administratortilgang på',
    },
    sv: {
      subject: 'Administratörsåtkomst beviljad - PadelO₂',
      greeting: 'Hej',
      message: 'Du har fått åtkomst till PadelO₂ Admin-panelen.',
      tournamentAccess: 'Turneringsåtkomst',
      tournamentName: 'Turnering',
      permissionsTitle: 'Dina behörigheter',
      permissionsDesc: 'Du har fått följande behörigheter för denna turnering:',
      adminPanelButton: 'Gå till Admin-panel',
      ifButtonDoesntWork: 'Om knappen inte fungerar, klistra in denna länk i din webbläsare:',
      footer: 'Välkommen till laget!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du får detta e-postmeddelande eftersom du har fått administratörsåtkomst på',
    },
    no: {
      subject: 'Administratortilgang gitt - PadelO₂',
      greeting: 'Hei',
      message: 'Du har fått tilgang til PadelO₂ Admin-panelet.',
      tournamentAccess: 'Turneringstilgang',
      tournamentName: 'Turnering',
      permissionsTitle: 'Dine tillatelser',
      permissionsDesc: 'Du har fått følgende tillatelser for denne turneringen:',
      adminPanelButton: 'Gå til Admin-panel',
      ifButtonDoesntWork: 'Hvis knappen ikke fungerer, lim inn denne lenken i nettleseren din:',
      footer: 'Velkommen til laget!',
      team: 'PadelO₂ Team',
      receivingEmail: 'Du mottar denne e-posten fordi du har fått administratortilgang på',
    },
    ar: {
      subject: 'تم منح صلاحيات المدير - PadelO₂',
      greeting: 'مرحبا',
      message: 'تم منحك الوصول إلى لوحة تحكم PadelO₂.',
      tournamentAccess: 'الوصول إلى البطولة',
      tournamentName: 'البطولة',
      permissionsTitle: 'صلاحياتك',
      permissionsDesc: 'تم منحك الصلاحيات التالية لهذه البطولة:',
      adminPanelButton: 'انتقل إلى لوحة التحكم',
      ifButtonDoesntWork: 'إذا لم يعمل الزر، الصق هذا الرابط في متصفحك:',
      footer: 'مرحباً بك في الفريق!',
      team: 'فريق PadelO₂',
      receivingEmail: 'أنت تتلقى هذا البريد الإلكتروني لأنه تم منحك صلاحيات المدير على',
    },
    zh: {
      subject: '已授予管理员访问权限 - PadelO₂',
      greeting: '您好',
      message: '您已获得 PadelO₂ 管理面板的访问权限。',
      tournamentAccess: '锦标赛访问',
      tournamentName: '锦标赛',
      permissionsTitle: '您的权限',
      permissionsDesc: '您已获得此锦标赛的以下权限:',
      adminPanelButton: '前往管理面板',
      ifButtonDoesntWork: '如果按钮不起作用，请将此链接粘贴到浏览器中:',
      footer: '欢迎加入团队！',
      team: 'PadelO₂ 团队',
      receivingEmail: '您收到此电子邮件是因为您在',
    },
  };

  const t = translations[locale] || translations.en;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>${t.subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 0; background: radial-gradient(circle at top, #e5f4ff 0, #f5f7fb 40%, #f8fafc 100%); }
      table { border-spacing: 0; border-collapse: collapse; }
      a { text-decoration: none; }
      .wrapper { width: 100%; padding: 32px 10px; }
      .main { width: 100%; max-width: 640px; margin: 0 auto; background: linear-gradient(145deg, #ffffff 0, #f4f7ff 60%, #edf7ff 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); }
      .font-default { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
      .h1 { font-size: 26px; line-height: 1.3; font-weight: 700; color: #0f172a; }
      .lead { font-size: 15px; line-height: 1.7; color: #1f2937; }
      .muted { font-size: 12px; line-height: 1.6; color: #6b7280; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
      .permission-item { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      .permission-item:last-child { border-bottom: none; }
      .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #06b6d4 0, #22c55e 100%); color: #ffffff; font-weight: 600; font-size: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
      .social-pill { border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.55); padding: 5px 10px 5px 7px; font-size: 11px; color: #111827; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; margin-right: 6px; background: #ffffff; transition: all 0.2s; }
      .social-pill:hover { border-color: #0369a1; background: #f0f9ff; }
      .social-icon-circle { width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #ffffff; margin-right: 4px; }
      .social-ig { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
      .social-yt { background: #ff0000; }
      .social-tt { background: #000000; }
      .social-fb { background: #1877f2; }
      .hide-mobile { display: table-cell; }
      @media screen and (max-width: 600px) {
        .p-body { padding: 0 18px 20px 18px !important; }
        .p-footer { padding: 14px 18px 24px 18px !important; }
        .center-mobile { text-align: center !important; }
        .hide-mobile { display: none !important; }
        .p-hero { padding: 20px 18px 10px 18px !important; }
      }
    </style>
  </head>
  <body class="font-default" style="margin:0;padding:0;background-color:#f8fafc !important;">
    <table role="presentation" class="wrapper" width="100%" style="background-color:#f8fafc !important;">
      <tr>
        <td align="center" style="background-color:#f8fafc !important;">
          <table role="presentation" class="main" style="background-color:#ffffff !important;">
            <!-- HEADER -->
            <tr>
              <td class="p-hero" style="padding: 22px 30px 12px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <div style="font-weight: 800; font-size: 22px; color: #0f172a; letter-spacing: 0.08em; text-transform: uppercase;">
                        PadelO<span style="font-size:1.55em; vertical-align:-2px; line-height:0;">₂</span>
                      </div>
                      <div style="font-size: 12px; color: #0369a1; margin-top: 3px; letter-spacing: 0.16em; text-transform: uppercase;">
                        ${getBrandTagline(locale)}
                      </div>
                    </td>
                    <td class="hide-mobile" align="right" valign="middle">
                      <table role="presentation" style="border-radius: 999px; background: linear-gradient(135deg, #e0f2fe, #bbf7d0); padding: 1px;">
                        <tr>
                          <td align="center" valign="middle" style="background: #ffffff; border-radius: 999px; padding: 6px 18px 7px 18px;">
                            <span style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a;">${t.tournamentAccess}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- TOP DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td class="p-body" style="padding: 20px 30px 10px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default">
                      <div class="h1" style="margin: 0 0 10px 0;">${t.greeting} ${firstNameOnly}!</div>
                      <p class="lead" style="margin: 0 0 20px 0;">${t.message}</p>
                      
                      <div class="info-box">
                        <p class="muted" style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e;">${t.tournamentName}:</p>
                        <p class="lead" style="margin: 0; color: #075985; font-weight: 600;">${tournamentName}</p>
                      </div>

                      <div style="margin: 24px 0;">
                        <p class="lead" style="margin: 0 0 12px 0; font-weight: 600;">${t.permissionsTitle}:</p>
                        <p class="muted" style="margin: 0 0 16px 0;">${t.permissionsDesc}</p>
                        <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
                          ${permissionsList.map(perm => `
                            <div class="permission-item">
                              <p class="lead" style="margin: 0; color: #1f2937;">✓ ${perm}</p>
                            </div>
                          `).join('')}
                        </div>
                      </div>

                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${adminPanelUrl}" class="button">${t.adminPanelButton}</a>
                        <p class="muted" style="margin: 12px 0 0 0; font-size: 11px;">${t.ifButtonDoesntWork}</p>
                        <p class="muted" style="margin: 4px 0 0 0; font-size: 11px; word-break: break-all; color: #0369a1;">${adminPanelUrl}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BOTTOM DIVIDER -->
            <tr>
              <td align="center">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #06b6d4 0, #22c55e 45%, #06b6d4 100%); opacity: 0.9;"></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td class="p-footer" style="padding: 10px 30px 24px 30px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td class="font-default" valign="middle">
                      <span class="muted" style="font-size: 11px;">${t.followJourney || 'Follow the journey:'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 3px 4px 3px 0%;">
                            <a href="https://www.instagram.com/padelo2com/" class="social-pill">
                              <span class="social-icon-circle social-ig">IG</span>
                              <span>Instagram</span>
                            </a>
                          </td>
                          <td style="padding: 3px 4px;">
                            <a href="https://www.youtube.com/@PadelO2" class="social-pill">
                              <span class="social-icon-circle social-yt">YT</span>
                              <span>YouTube</span>
                            </a>
                          </td>
                          <td style="padding: 3px 4px;">
                            <a href="https://www.tiktok.com/@padelo2com" class="social-pill">
                              <span class="social-icon-circle social-tt">TT</span>
                              <span>TikTok</span>
                            </a>
                          </td>
                          <td style="padding: 3px 0 3px 4px;">
                            <a href="https://www.facebook.com/profile.php?id=61583860325680" class="social-pill">
                              <span class="social-icon-circle social-fb">f</span>
                              <span>Facebook</span>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top: 16px;">
                      <p class="muted" style="margin: 0 0 4px 0;">${t.receivingEmail} <span style="color: #0369a1;">PadelO₂.com</span>.</p>
                      <p class="muted" style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} PadelO<span style="font-size:1.4em; vertical-align:-1px; line-height:0;">₂</span>. All rights reserved.</p>
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 16px; font-weight: 600;">${t.footer}</p>
                      <p style="margin: 0; color: #999999; font-size: 14px;">${t.team}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

