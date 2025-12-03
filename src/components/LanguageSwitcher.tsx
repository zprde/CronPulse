import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
        i18n.changeLanguage(newLang);
    };

    const currentLang = i18n.language.startsWith('zh') ? '中文' : 'English';

    return (
        <button onClick={toggleLanguage} className="language-switcher btn btn-secondary btn-sm" title="Switch Language">
            🌐 {currentLang}
            <style>{`
                .language-switcher {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }
            `}</style>
        </button>
    );
}
