'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useLocale } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('Auth');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setUser(data.user);
          // Store token if provided
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const translations: Record<string, Record<string, string>> = {
    en: {
      verifying: 'Verifying your email...',
      verificationFailed: 'Verification Failed',
      congratulations: 'Congratulations! Your email has been verified',
      fullAccess: 'You now have full access to your account on PadelO₂.',
      name: 'Name',
      goToDashboard: 'Go to Dashboard',
      viewTournaments: 'View Tournaments',
      goToLogin: 'Go to Login'
    },
    ru: {
      verifying: 'Подтверждение вашего email...',
      verificationFailed: 'Ошибка подтверждения',
      congratulations: 'Поздравляем! Ваш email подтвержден',
      fullAccess: 'Теперь вы имеете полный доступ к вашему аккаунту на PadelO₂.',
      name: 'Имя',
      goToDashboard: 'Перейти в кабинет',
      viewTournaments: 'К турнирам',
      goToLogin: 'Перейти к входу'
    },
    ua: {
      verifying: 'Підтвердження вашого email...',
      verificationFailed: 'Помилка підтвердження',
      congratulations: 'Вітаємо! Ваш email підтверджено',
      fullAccess: 'Тепер ви маєте повний доступ до вашого акаунта на PadelO₂.',
      name: 'Ім\'я',
      goToDashboard: 'Перейти до кабінету',
      viewTournaments: 'До турнірів',
      goToLogin: 'Перейти до входу'
    },
    es: {
      verifying: 'Verificando tu correo electrónico...',
      verificationFailed: 'Verificación Fallida',
      congratulations: '¡Felicidades! Tu correo electrónico ha sido verificado',
      fullAccess: 'Ahora tienes acceso completo a tu cuenta en PadelO₂.',
      name: 'Nombre',
      goToDashboard: 'Ir al Panel',
      viewTournaments: 'Ver Torneos',
      goToLogin: 'Ir a Iniciar Sesión'
    },
    fr: {
      verifying: 'Vérification de votre e-mail...',
      verificationFailed: 'Échec de la Vérification',
      congratulations: 'Félicitations! Votre e-mail a été vérifié',
      fullAccess: 'Vous avez maintenant un accès complet à votre compte sur PadelO₂.',
      name: 'Nom',
      goToDashboard: 'Aller au Tableau de bord',
      viewTournaments: 'Voir les Tournois',
      goToLogin: 'Aller à la Connexion'
    },
    de: {
      verifying: 'Ihre E-Mail wird überprüft...',
      verificationFailed: 'Überprüfung Fehlgeschlagen',
      congratulations: 'Glückwunsch! Ihre E-Mail wurde überprüft',
      fullAccess: 'Sie haben jetzt vollen Zugriff auf Ihr Konto bei PadelO₂.',
      name: 'Name',
      goToDashboard: 'Zum Dashboard gehen',
      viewTournaments: 'Turniere anzeigen',
      goToLogin: 'Zur Anmeldung gehen'
    },
    it: {
      verifying: 'Verifica della tua email in corso...',
      verificationFailed: 'Verifica Fallita',
      congratulations: 'Congratulazioni! La tua email è stata verificata',
      fullAccess: 'Ora hai accesso completo al tuo account su PadelO₂.',
      name: 'Nome',
      goToDashboard: 'Vai alla Dashboard',
      viewTournaments: 'Visualizza Tornei',
      goToLogin: 'Vai al Login'
    },
    ca: {
      verifying: 'Verificant el teu correu electrònic...',
      verificationFailed: 'Verificació Fallida',
      congratulations: 'Felicitats! El teu correu electrònic ha estat verificat',
      fullAccess: 'Ara tens accés complet al teu compte a PadelO₂.',
      name: 'Nom',
      goToDashboard: 'Anar al Tauler',
      viewTournaments: 'Veure Torneigs',
      goToLogin: 'Anar a Iniciar Sessió'
    },
    nl: {
      verifying: 'Uw e-mail wordt geverifieerd...',
      verificationFailed: 'Verificatie Mislukt',
      congratulations: 'Gefeliciteerd! Uw e-mail is geverifieerd',
      fullAccess: 'U heeft nu volledige toegang tot uw account op PadelO₂.',
      name: 'Naam',
      goToDashboard: 'Naar Dashboard',
      viewTournaments: 'Bekijk Toernooien',
      goToLogin: 'Naar Inloggen'
    },
    da: {
      verifying: 'Bekræfter din e-mail...',
      verificationFailed: 'Bekræftelse Mislykkedes',
      congratulations: 'Tillykke! Din e-mail er blevet bekræftet',
      fullAccess: 'Du har nu fuld adgang til din konto på PadelO₂.',
      name: 'Navn',
      goToDashboard: 'Gå til Dashboard',
      viewTournaments: 'Se Turneringer',
      goToLogin: 'Gå til Login'
    },
    sv: {
      verifying: 'Verifierar din e-post...',
      verificationFailed: 'Verifiering Misslyckades',
      congratulations: 'Grattis! Din e-post har verifierats',
      fullAccess: 'Du har nu full åtkomst till ditt konto på PadelO₂.',
      name: 'Namn',
      goToDashboard: 'Gå till Dashboard',
      viewTournaments: 'Visa Turneringar',
      goToLogin: 'Gå till Inloggning'
    },
    no: {
      verifying: 'Bekrefter din e-post...',
      verificationFailed: 'Bekreftelse Mislyktes',
      congratulations: 'Gratulerer! Din e-post er bekreftet',
      fullAccess: 'Du har nå full tilgang til din konto på PadelO₂.',
      name: 'Navn',
      goToDashboard: 'Gå til Dashboard',
      viewTournaments: 'Se Turneringer',
      goToLogin: 'Gå til Innlogging'
    },
    ar: {
      verifying: 'جارٍ التحقق من بريدك الإلكتروني...',
      verificationFailed: 'فشل التحقق',
      congratulations: 'تهانينا! تم التحقق من بريدك الإلكتروني',
      fullAccess: 'لديك الآن وصول كامل إلى حسابك على PadelO₂.',
      name: 'الاسم',
      goToDashboard: 'الذهاب إلى لوحة التحكم',
      viewTournaments: 'عرض البطولات',
      goToLogin: 'الذهاب إلى تسجيل الدخول'
    },
    zh: {
      verifying: '正在验证您的电子邮件...',
      verificationFailed: '验证失败',
      congratulations: '恭喜！您的电子邮件已验证',
      fullAccess: '您现在可以完全访问您在 PadelO₂ 上的账户。',
      name: '姓名',
      goToDashboard: '前往仪表板',
      viewTournaments: '查看锦标赛',
      goToLogin: '前往登录'
    }
  };

  const t = translations[locale] || translations.en;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t.verifying}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-background-secondary rounded-lg border border-border p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-poppins font-bold mb-4 text-text">{t.verificationFailed}</h1>
          <p className="text-text-secondary font-poppins mb-6">{message}</p>
          <Link
            href={`/${locale}/login`}
            className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg font-poppins font-semibold hover:opacity-90 transition-opacity"
          >
            {t.goToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background-secondary rounded-lg border border-border p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-poppins font-bold mb-4 text-text">
          {t.congratulations}
        </h1>
        <p className="text-text-secondary font-poppins mb-6">
          {t.fullAccess}
        </p>
        {user && (
          <div className="bg-background rounded-lg p-4 mb-6 text-left">
            <p className="text-text-secondary text-sm mb-1">
              {t.name}
            </p>
            <p className="text-text font-poppins font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-text-secondary text-sm mb-1 mt-3">
              Email
            </p>
            <p className="text-text font-poppins">{user.email}</p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg font-poppins font-semibold hover:opacity-90 transition-opacity"
          >
            {t.goToDashboard}
          </Link>
          <Link
            href={`/${locale}/tournaments`}
            className="inline-block bg-background text-text px-6 py-3 rounded-lg font-poppins font-semibold hover:opacity-90 transition-opacity border border-border"
          >
            {t.viewTournaments}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

