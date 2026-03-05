/**
 * Womencypedia Internationalization (i18n) Module
 * 
 * Manages frontend locale switching and integrates with Strapi's i18n plugin.
 * - Detects user's preferred language from browser / localStorage
 * - Passes locale to all StrapiAPI requests automatically
 * - Provides UI translation strings for ALL static page content
 * - Renders a language switcher dropdown component
 * - Dynamically translates ALL elements with data-i18n attributes
 */

const I18N = {
    // Current active locale code (e.g. 'en', 'fr', 'es', 'ar', 'yo', 'sw')
    currentLocale: 'en',

    // Supported locales — must match Strapi Admin > Settings > Internationalization
    supportedLocales: [
        { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
        { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇵🇹' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
        { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', dir: 'ltr', flag: '🇰🇪' },
        { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', dir: 'ltr', flag: '🇳🇬' },
        { code: 'ha', name: 'Hausa', nativeName: 'Hausa', dir: 'ltr', flag: '🇳🇬' },
        { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', dir: 'ltr', flag: '🇪🇹' },
        { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', dir: 'ltr', flag: '🇿🇦' },
    ],

    // localStorage key for persisting locale preference
    STORAGE_KEY: 'womencypedia_locale',

    // ─────────────────────────────────────────────────────────
    // TRANSLATION DICTIONARIES
    // Keys are used as data-i18n="keyName" attributes in HTML
    // ─────────────────────────────────────────────────────────
    translations: {
        en: {
            // Navigation
            search: 'Search the archive...',
            donate: 'Donate',
            signIn: 'Sign In',
            signOut: 'Sign Out',
            explore: 'Explore',
            learn: 'Learn',
            participate: 'Participate',
            about: 'About',
            home: 'Home',
            browse: 'Browse',
            featured: 'Featured',
            collections: 'Collections',
            timelines: 'Timelines',
            education: 'Education',
            registry: 'Registry',
            enterprises: 'Enterprises',
            research: 'Research',
            publications: 'Publications',
            resources: 'Resources',
            nominateWoman: 'Nominate a Woman',
            shareYourStory: 'Share Your Story',
            contributorGuidelines: 'Contributor Guidelines',
            aboutUs: 'About Us',
            founders: 'Founders',
            contributors: 'Contributors',
            methodology: 'Methodology',
            editorialStandards: 'Editorial Standards',
            contact: 'Contact',
            myProfile: 'My Profile',
            admin: 'Admin',
            sampleBiography: 'Sample Biography',

            // Hero Section
            heroBadge: 'The Heritage Project',
            heroTitle: 'The world\'s first <em>interpretive</em> encyclopedia of women — revealing the depth, power, cultural meaning behind every woman and preserving their story. Built on rigorous scholarship, ethical storytelling, and cultural truth.',
            heroDescription: 'Restoring the stories history overlooked, with dignity, context, and global insight.',
            exploreArchive: 'Explore the Archive',
            learnMore: 'Learn More',

            // Credibility Strip
            globalMission: 'The Global Mission',
            worldRegions: 'World Regions',
            languages: 'Languages',
            historicalEras: 'Historical Eras',
            categories: 'Categories',
            credibilityTagline: 'Built on rigorous scholarship, ethical storytelling, and cultural truth — powered by community contributors worldwide.',

            // Why Section
            whyWomencypedia: 'Why Womencypedia?',
            correctingImbalance: 'Correcting Historical Imbalance',
            whyDescription: 'For centuries, women\'s contributions to history have been overlooked, minimized, or attributed to men. This systemic erasure has left gaping holes in our collective understanding of human achievement.',

            // Featured Quote
            featuredCollection: 'Featured Collection',
            voicesOfCentury: 'Voices of the 19th Century',
            quoteText: '"Dear Woman, Do you have a story of resilience, lament, challenge, or victory? Tell it now — before the world tells it its own way."',

            // Common UI
            readMore: 'Read More',
            loading: 'Loading...',
            noResults: 'No results found',
            error: 'Something went wrong',
            retry: 'Retry',
            language: 'Language',
            profile: 'My Profile',
            allRegions: 'All Regions',
            allEras: 'All Eras',
            allCategories: 'All Categories',
            clearAll: 'Clear all',
            found: 'Found',
            results: 'results',
            privacyPolicy: 'Privacy Policy',
            termsOfUse: 'Terms of Use',
            copyright: '© 2026 Womencypedia Foundation. All rights reserved.',
            memberSince: 'Member since',
            editProfile: 'Edit Profile',
            saveChanges: 'Save Changes',
            cancel: 'Cancel',
            readBiography: 'Read Biography',

            // Footer
            footerAbout: 'The world\'s first interpretive encyclopedia of women.',
            quickLinks: 'Quick Links',
            legal: 'Legal',
            followUs: 'Follow Us',

            // Browse Leaders / Registry
            browseLeaders: 'Browse Leaders',
            leaderProfile: 'Leader Profile',
            applyVerification: 'Apply for Verification',
            controlledContributions: 'Controlled Contributions',
            partners: 'Partners',
            fellowship: 'Fellowship',
            reports: 'Reports',

            // Donate
            supportMission: 'Support Our Mission',
            oneTime: 'One-Time',
            monthly: 'Monthly',
            legacy: 'Legacy Circle',
        },
        fr: {
            search: 'Rechercher dans les archives...',
            donate: 'Faire un don',
            signIn: 'Se connecter',
            signOut: 'Se déconnecter',
            explore: 'Explorer',
            learn: 'Apprendre',
            participate: 'Participer',
            about: 'À propos',
            home: 'Accueil',
            browse: 'Parcourir',
            featured: 'En vedette',
            collections: 'Collections',
            timelines: 'Chronologies',
            education: 'Éducation',
            registry: 'Registre',
            enterprises: 'Entreprises',
            research: 'Recherche',
            publications: 'Publications',
            resources: 'Ressources',
            nominateWoman: 'Proposer une femme',
            shareYourStory: 'Partagez votre histoire',
            contributorGuidelines: 'Guide du contributeur',
            aboutUs: 'À propos de nous',
            founders: 'Fondateurs',
            contributors: 'Contributeurs',
            methodology: 'Méthodologie',
            editorialStandards: 'Normes éditoriales',
            contact: 'Contact',
            myProfile: 'Mon profil',
            admin: 'Admin',
            sampleBiography: 'Biographie type',
            heroBadge: 'Le Projet Patrimoine',
            heroTitle: 'La première encyclopédie <em>interprétative</em> des femmes au monde — révélant la profondeur, la puissance, le sens culturel derrière chaque femme et préservant son histoire.',
            heroDescription: 'Restaurer les histoires que l\'histoire a oubliées, avec dignité, contexte et vision globale.',
            exploreArchive: 'Explorer les archives',
            learnMore: 'En savoir plus',
            globalMission: 'La mission mondiale',
            worldRegions: 'Régions du monde',
            languages: 'Langues',
            historicalEras: 'Époques historiques',
            categories: 'Catégories',
            credibilityTagline: 'Fondée sur une recherche rigoureuse, une narration éthique et la vérité culturelle — propulsée par des contributeurs du monde entier.',
            whyWomencypedia: 'Pourquoi Womencypedia ?',
            correctingImbalance: 'Corriger le déséquilibre historique',
            whyDescription: 'Pendant des siècles, les contributions des femmes à l\'histoire ont été négligées, minimisées ou attribuées aux hommes.',
            featuredCollection: 'Collection en vedette',
            voicesOfCentury: 'Voix du XIXe siècle',
            quoteText: '« Chère femme, avez-vous une histoire de résilience, de défi ou de victoire ? Racontez-la maintenant — avant que le monde ne la raconte à sa manière. »',
            readMore: 'Lire la suite',
            loading: 'Chargement...',
            noResults: 'Aucun résultat trouvé',
            error: 'Une erreur est survenue',
            retry: 'Réessayer',
            language: 'Langue',
            profile: 'Mon profil',
            allRegions: 'Toutes les régions',
            allEras: 'Toutes les époques',
            allCategories: 'Toutes les catégories',
            clearAll: 'Tout effacer',
            found: 'Trouvé',
            results: 'résultats',
            privacyPolicy: 'Politique de confidentialité',
            termsOfUse: 'Conditions d\'utilisation',
            copyright: '© 2026 Fondation Womencypedia. Tous droits réservés.',
            memberSince: 'Membre depuis',
            editProfile: 'Modifier le profil',
            saveChanges: 'Enregistrer',
            cancel: 'Annuler',
            readBiography: 'Lire la biographie',
            footerAbout: 'La première encyclopédie interprétative des femmes au monde.',
            quickLinks: 'Liens rapides',
            legal: 'Mentions légales',
            followUs: 'Suivez-nous',
            browseLeaders: 'Parcourir les leaders',
            supportMission: 'Soutenir notre mission',
            oneTime: 'Ponctuel',
            monthly: 'Mensuel',
            legacy: 'Cercle patrimonial',
        },
        es: {
            search: 'Buscar en el archivo...',
            donate: 'Donar',
            signIn: 'Iniciar sesión',
            signOut: 'Cerrar sesión',
            explore: 'Explorar',
            learn: 'Aprender',
            participate: 'Participar',
            about: 'Acerca de',
            home: 'Inicio',
            browse: 'Navegar',
            featured: 'Destacados',
            collections: 'Colecciones',
            timelines: 'Líneas de tiempo',
            education: 'Educación',
            registry: 'Registro',
            enterprises: 'Empresas',
            research: 'Investigación',
            publications: 'Publicaciones',
            resources: 'Recursos',
            nominateWoman: 'Nominar a una mujer',
            shareYourStory: 'Comparte tu historia',
            contributorGuidelines: 'Guía del colaborador',
            aboutUs: 'Sobre nosotros',
            founders: 'Fundadores',
            contributors: 'Colaboradores',
            methodology: 'Metodología',
            editorialStandards: 'Estándares editoriales',
            contact: 'Contacto',
            myProfile: 'Mi perfil',
            admin: 'Admin',
            sampleBiography: 'Biografía de muestra',
            heroBadge: 'El Proyecto Patrimonio',
            heroTitle: 'La primera enciclopedia <em>interpretativa</em> de mujeres del mundo — revelando la profundidad, el poder y el significado cultural detrás de cada mujer y preservando su historia.',
            heroDescription: 'Restaurando las historias que la historia pasó por alto, con dignidad, contexto y visión global.',
            exploreArchive: 'Explorar el archivo',
            learnMore: 'Más información',
            globalMission: 'La misión global',
            worldRegions: 'Regiones del mundo',
            languages: 'Idiomas',
            historicalEras: 'Épocas históricas',
            categories: 'Categorías',
            credibilityTagline: 'Construida sobre investigación rigurosa, narración ética y verdad cultural — impulsada por colaboradores de todo el mundo.',
            whyWomencypedia: '¿Por qué Womencypedia?',
            correctingImbalance: 'Corrigiendo el desequilibrio histórico',
            whyDescription: 'Durante siglos, las contribuciones de las mujeres a la historia han sido pasadas por alto, minimizadas o atribuidas a los hombres.',
            featuredCollection: 'Colección destacada',
            voicesOfCentury: 'Voces del siglo XIX',
            quoteText: '«Querida mujer, ¿tienes una historia de resiliencia, desafío o victoria? Cuéntala ahora — antes de que el mundo la cuente a su manera.»',
            readMore: 'Leer más',
            loading: 'Cargando...',
            noResults: 'No se encontraron resultados',
            error: 'Algo salió mal',
            retry: 'Reintentar',
            language: 'Idioma',
            profile: 'Mi perfil',
            allRegions: 'Todas las regiones',
            allEras: 'Todas las épocas',
            allCategories: 'Todas las categorías',
            clearAll: 'Borrar todo',
            found: 'Encontrados',
            results: 'resultados',
            privacyPolicy: 'Política de privacidad',
            termsOfUse: 'Términos de uso',
            copyright: '© 2026 Fundación Womencypedia. Todos los derechos reservados.',
            memberSince: 'Miembro desde',
            editProfile: 'Editar perfil',
            saveChanges: 'Guardar cambios',
            cancel: 'Cancelar',
            readBiography: 'Leer biografía',
            footerAbout: 'La primera enciclopedia interpretativa de mujeres del mundo.',
            quickLinks: 'Enlaces rápidos',
            legal: 'Legal',
            followUs: 'Síguenos',
            supportMission: 'Apoya nuestra misión',
        },
        pt: {
            search: 'Pesquisar no arquivo...',
            donate: 'Doar',
            signIn: 'Entrar',
            signOut: 'Sair',
            explore: 'Explorar',
            learn: 'Aprender',
            participate: 'Participar',
            about: 'Sobre',
            home: 'Início',
            browse: 'Navegar',
            featured: 'Destaque',
            collections: 'Coleções',
            timelines: 'Cronologias',
            education: 'Educação',
            registry: 'Registro',
            enterprises: 'Empreendimentos',
            research: 'Pesquisa',
            publications: 'Publicações',
            resources: 'Recursos',
            nominateWoman: 'Indicar uma mulher',
            shareYourStory: 'Compartilhe sua história',
            contributorGuidelines: 'Guia do colaborador',
            aboutUs: 'Sobre nós',
            founders: 'Fundadores',
            contributors: 'Colaboradores',
            methodology: 'Metodologia',
            editorialStandards: 'Padrões editoriais',
            contact: 'Contato',
            myProfile: 'Meu perfil',
            heroBadge: 'O Projeto Patrimônio',
            heroTitle: 'A primeira enciclopédia <em>interpretativa</em> de mulheres do mundo — revelando a profundidade, o poder e o significado cultural por trás de cada mulher e preservando sua história.',
            heroDescription: 'Restaurando as histórias que a história esqueceu, com dignidade, contexto e visão global.',
            exploreArchive: 'Explorar o arquivo',
            learnMore: 'Saiba mais',
            globalMission: 'A missão global',
            worldRegions: 'Regiões do mundo',
            languages: 'Idiomas',
            historicalEras: 'Épocas históricas',
            categories: 'Categorias',
            credibilityTagline: 'Construída sobre pesquisa rigorosa, narrativa ética e verdade cultural — impulsionada por colaboradores de todo o mundo.',
            whyWomencypedia: 'Por que Womencypedia?',
            correctingImbalance: 'Corrigindo o desequilíbrio histórico',
            whyDescription: 'Durante séculos, as contribuições das mulheres para a história foram ignoradas, minimizadas ou atribuídas aos homens.',
            quoteText: '"Querida mulher, você tem uma história de resiliência, desafio ou vitória? Conte agora — antes que o mundo conte do seu jeito."',
            readMore: 'Leia mais',
            loading: 'Carregando...',
            noResults: 'Nenhum resultado encontrado',
            error: 'Algo deu errado',
            retry: 'Tentar novamente',
            language: 'Idioma',
            copyright: '© 2026 Fundação Womencypedia. Todos os direitos reservados.',
            footerAbout: 'A primeira enciclopédia interpretativa de mulheres do mundo.',
            quickLinks: 'Links rápidos',
            legal: 'Legal',
            supportMission: 'Apoie nossa missão',
        },
        ar: {
            search: 'ابحث في الأرشيف...',
            donate: 'تبرع',
            signIn: 'تسجيل الدخول',
            signOut: 'تسجيل الخروج',
            explore: 'استكشاف',
            learn: 'تعلم',
            participate: 'شارك',
            about: 'حول',
            home: 'الرئيسية',
            browse: 'تصفح',
            featured: 'مميز',
            collections: 'المجموعات',
            timelines: 'الجداول الزمنية',
            education: 'التعليم',
            registry: 'السجل',
            enterprises: 'المشاريع',
            research: 'البحث',
            publications: 'المنشورات',
            resources: 'الموارد',
            nominateWoman: 'رشح امرأة',
            shareYourStory: 'شاركي قصتك',
            contributorGuidelines: 'دليل المساهم',
            aboutUs: 'من نحن',
            founders: 'المؤسسون',
            contributors: 'المساهمون',
            methodology: 'المنهجية',
            editorialStandards: 'المعايير التحريرية',
            contact: 'اتصل بنا',
            myProfile: 'ملفي الشخصي',
            heroBadge: 'مشروع التراث',
            heroTitle: 'أول موسوعة <em>تفسيرية</em> للنساء في العالم — تكشف العمق والقوة والمعنى الثقافي وراء كل امرأة وتحفظ قصتها.',
            heroDescription: 'استعادة القصص التي أغفلها التاريخ، بكرامة وسياق ورؤية عالمية.',
            exploreArchive: 'استكشاف الأرشيف',
            learnMore: 'اعرف المزيد',
            globalMission: 'المهمة العالمية',
            worldRegions: 'مناطق العالم',
            languages: 'اللغات',
            historicalEras: 'العصور التاريخية',
            categories: 'الفئات',
            credibilityTagline: 'مبنية على بحث دقيق وسرد أخلاقي وحقيقة ثقافية — بدعم من مساهمين من جميع أنحاء العالم.',
            whyWomencypedia: 'لماذا ومنسيبيديا؟',
            correctingImbalance: 'تصحيح الخلل التاريخي',
            whyDescription: 'لقرون، تم تجاهل مساهمات النساء في التاريخ أو التقليل منها أو نسبها إلى الرجال.',
            quoteText: '"عزيزتي المرأة، هل لديك قصة صمود أو تحدٍ أو انتصار؟ أخبريها الآن — قبل أن يرويها العالم بطريقته."',
            readMore: 'اقرأ المزيد',
            loading: 'جاري التحميل...',
            noResults: 'لم يتم العثور على نتائج',
            error: 'حدث خطأ ما',
            retry: 'إعادة المحاولة',
            language: 'اللغة',
            profile: 'ملفي الشخصي',
            allRegions: 'جميع المناطق',
            allEras: 'جميع العصور',
            allCategories: 'جميع الفئات',
            clearAll: 'مسح الكل',
            found: 'وجدت',
            results: 'نتائج',
            privacyPolicy: 'سياسة الخصوصية',
            termsOfUse: 'شروط الاستخدام',
            copyright: '© 2026 مؤسسة ومنسيبيديا. جميع الحقوق محفوظة.',
            footerAbout: 'أول موسوعة تفسيرية للنساء في العالم.',
            quickLinks: 'روابط سريعة',
            legal: 'قانوني',
            supportMission: 'ادعم مهمتنا',
        },
        sw: {
            search: 'Tafuta katika kumbukumbu...',
            donate: 'Changia',
            signIn: 'Ingia',
            signOut: 'Toka',
            explore: 'Chunguza',
            learn: 'Jifunze',
            participate: 'Shiriki',
            about: 'Kuhusu',
            home: 'Nyumbani',
            browse: 'Vinjari',
            featured: 'Pendekeza',
            collections: 'Makusanyo',
            timelines: 'Kalenda',
            education: 'Elimu',
            registry: 'Sajili',
            enterprises: 'Biashara',
            research: 'Utafiti',
            publications: 'Machapisho',
            resources: 'Rasilimali',
            nominateWoman: 'Teua mwanamke',
            shareYourStory: 'Shiriki hadithi yako',
            contributorGuidelines: 'Mwongozo wa mchangiaji',
            aboutUs: 'Kuhusu sisi',
            founders: 'Waanzilishi',
            contributors: 'Wachangiaji',
            methodology: 'Mbinu',
            editorialStandards: 'Viwango vya uhariri',
            contact: 'Wasiliana nasi',
            myProfile: 'Wasifu wangu',
            heroBadge: 'Mradi wa Urithi',
            heroTitle: 'Ensaiklopedia ya kwanza ya <em>tafsiri</em> ya wanawake duniani — ikifichua kina, nguvu, na maana ya kitamaduni nyuma ya kila mwanamke na kuhifadhi hadithi yake.',
            heroDescription: 'Kurejesha hadithi ambazo historia ilizipuuza, kwa heshima, muktadha na utambuzi wa kimataifa.',
            exploreArchive: 'Chunguza kumbukumbu',
            learnMore: 'Jifunze zaidi',
            globalMission: 'Dhamira ya kimataifa',
            worldRegions: 'Mikoa ya dunia',
            languages: 'Lugha',
            historicalEras: 'Vipindi vya kihistoria',
            categories: 'Makundi',
            credibilityTagline: 'Imejengwa juu ya utafiti mkali, usimulizi wa maadili na ukweli wa kitamaduni — inayoendeshwa na wachangiaji duniani kote.',
            whyWomencypedia: 'Kwa nini Womencypedia?',
            correctingImbalance: 'Kurekebisha usawa wa kihistoria',
            whyDescription: 'Kwa karne nyingi, michango ya wanawake katika historia imepuuzwa, kupunguzwa, au kuhusishwa na wanaume.',
            quoteText: '"Mwanamke mpendwa, je una hadithi ya uvumilivu, changamoto, au ushindi? Ieleze sasa — kabla dunia haijaieleza kwa njia yake."',
            readMore: 'Soma zaidi',
            loading: 'Inapakia...',
            noResults: 'Hakuna matokeo yaliyopatikana',
            error: 'Kitu kimeenda vibaya',
            retry: 'Jaribu tena',
            copyright: '© 2026 Shirika la Womencypedia. Haki zote zimehifadhiwa.',
            footerAbout: 'Ensaiklopedia ya kwanza ya tafsiri ya wanawake duniani.',
            quickLinks: 'Viungo vya haraka',
            supportMission: 'Saidia dhamira yetu',
        },
        yo: {
            search: 'Wa ninu ibi ipamọ...',
            donate: 'Ṣe iranlọwọ',
            signIn: 'Wọlé',
            signOut: 'Jáde',
            explore: 'Ṣàwárí',
            learn: 'Kọ ẹkọ',
            participate: 'Kópa',
            about: 'Nípa',
            home: 'Ilé',
            browse: 'Léwò',
            featured: 'Ìfojúsùn',
            collections: 'Àkójọpọ̀',
            timelines: 'Ìlà àkókò',
            education: 'Ẹ̀kọ́',
            registry: 'Ìforúkọsílẹ̀',
            enterprises: 'Iṣẹ́',
            research: 'Ìwádìí',
            publications: 'Àwọn ìtẹ̀jáde',
            resources: 'Àwọn ohun àmúlò',
            nominateWoman: 'Yan obinrin kan',
            shareYourStory: 'Pín ìtàn rẹ',
            contributorGuidelines: 'Ètò olùkópa',
            aboutUs: 'Nípa wa',
            founders: 'Àwọn olùdásílẹ̀',
            contributors: 'Àwọn olùkópa',
            methodology: 'Ọ̀nà ìṣe',
            editorialStandards: 'Ìlànà ìṣàtúnṣe',
            contact: 'Kàn sí wa',
            myProfile: 'Ìpèsè mi',
            heroBadge: 'Iṣẹ́ Àjogúnbá',
            heroTitle: 'Ìwé-ìmọ̀ àkọ́kọ́ <em>àsọyé</em> ti àwọn obìnrin lágbàyé — tí ń ṣàfihàn ìjìnlẹ̀, agbára, àti ìtumọ̀ àṣà lẹ́yìn obìnrin kọ̀ọ̀kan àti títọ́jú ìtàn wọn.',
            heroDescription: 'Títúnṣe àwọn ìtàn tí ìtàn gbàgbé, pẹ̀lú ọlá, ìpèsè, àti ìmọ̀ àgbáyé.',
            exploreArchive: 'Ṣàwárí ibi ìpamọ́',
            learnMore: 'Kọ́ síi',
            globalMission: 'Iṣẹ́ àgbáyé',
            worldRegions: 'Àwọn agbègbè àgbáyé',
            languages: 'Àwọn èdè',
            historicalEras: 'Àwọn àkókò ìtàn',
            categories: 'Àwọn ẹ̀ka',
            credibilityTagline: 'A dá lórí ìwádìí líle, ìtàn ìwà rere àti òtítọ́ àṣà — tí àwọn olùkópa lágbàyé ń ṣiṣẹ́.',
            whyWomencypedia: 'Kí nìdí Womencypedia?',
            correctingImbalance: 'Àtúnṣe àìdọ́gba ìtàn',
            readMore: 'Ka siwaju',
            loading: 'Nṣiṣẹ́...',
            noResults: 'A kò rí èsì kankan',
            error: 'Nǹkan kan ṣẹlẹ̀',
            retry: 'Tún gbìyànjú',
            copyright: '© 2026 Womencypedia Foundation. Gbogbo ẹ̀tọ́ ni a pa mọ́.',
            footerAbout: 'Ìwé-ìmọ̀ àkọ́kọ́ àsọyé ti àwọn obìnrin lágbàyé.',
            quickLinks: 'Àwọn ọ̀nà yíyára',
            supportMission: 'Ṣe àtìlẹ́yìn fún iṣẹ́ wa',
        },
        ha: {
            search: 'Bincika cikin tarihi...',
            donate: 'Bayar da gudummawa',
            signIn: 'Shiga',
            signOut: 'Fita',
            explore: 'Bincika',
            learn: 'Koyi',
            participate: 'Shiga ciki',
            about: 'Game da mu',
            home: 'Gida',
            browse: 'Duba',
            featured: 'Sananne',
            collections: 'Tarin',
            timelines: 'Jadawalin lokaci',
            education: 'Ilimi',
            registry: 'Rajista',
            enterprises: 'Kasuwanci',
            research: 'Bincike',
            publications: 'Bugawa',
            resources: 'Albarkatu',
            nominateWoman: 'Zaɓi mace',
            shareYourStory: 'Raba labarinka',
            contributorGuidelines: 'Jagoran mai ba da gudummawa',
            aboutUs: 'Game da mu',
            founders: 'Masu kafa',
            contributors: 'Masu ba da gudummawa',
            methodology: 'Hanyar bincike',
            editorialStandards: 'Ka\'idojin edita',
            contact: 'Tuntuɓe mu',
            myProfile: 'Bayanan ku',
            heroBadge: 'Aikin Gado',
            heroTitle: 'Na farko <em>fassara</em> encyclopedia ta mata a duniya — tana bayyana zurfin, ƙarfi, da ma\'anar al\'adu a bayan kowace mace tare da adana labarinta.',
            heroDescription: 'Maido da labaran da tarihi ya ƙyale, da mutunci, mahallin, da hangen duniya.',
            exploreArchive: 'Bincika tarihin',
            learnMore: 'Ƙara koyo',
            globalMission: 'Manufar duniya',
            worldRegions: 'Yankunan duniya',
            languages: 'Harsuna',
            historicalEras: 'Zamunnan tarihi',
            categories: 'Rukunoni',
            credibilityTagline: 'An gina ta ne akan bincike mai zurfi, labari na ɗa\'a da gaskiyar al\'adu — ana tallafawa ta masu ba da gudummawa a duk duniya.',
            readMore: 'Karanta ƙari',
            loading: 'Ana lodi...',
            noResults: 'Ba a sami sakamako ba',
            error: 'Wani abu ya faru kuskure',
            copyright: '© 2026 Gidauniyar Womencypedia. An kiyaye duk haƙƙoƙi.',
            footerAbout: 'Na farko fassara encyclopedia ta mata a duniya.',
            supportMission: 'Tallafa wa manufarmu',
        },
        am: {
            search: 'በማህደር ውስጥ ይፈልጉ...',
            donate: 'ይለግሱ',
            signIn: 'ይግቡ',
            signOut: 'ይውጡ',
            explore: 'ያስሱ',
            learn: 'ይማሩ',
            participate: 'ይሳተፉ',
            about: 'ስለ እኛ',
            home: 'ዋና ገጽ',
            browse: 'ያስሱ',
            featured: 'ተለይቶ የቀረበ',
            collections: 'ስብስቦች',
            timelines: 'የጊዜ መስመሮች',
            education: 'ትምህርት',
            registry: 'ምዝገባ',
            enterprises: 'ድርጅቶች',
            research: 'ጥናት',
            publications: 'ህትመቶች',
            resources: 'ግብዓቶች',
            nominateWoman: 'ሴት ያጩ',
            shareYourStory: 'ታሪክዎን ያጋሩ',
            aboutUs: 'ስለ እኛ',
            founders: 'መስራቾች',
            contributors: 'አስተዋጽኦ አድራጊዎች',
            contact: 'ያግኙን',
            myProfile: 'የእኔ መገለጫ',
            heroBadge: 'የቅርስ ፕሮጀክት',
            heroTitle: 'የዓለም የመጀመሪያ <em>ትርጓሜያዊ</em> የሴቶች ኢንሳይክሎፒዲያ — ከእያንዳንዱ ሴት ጀርባ ያለውን ጥልቀት፣ ኃይል እና ባህላዊ ትርጉም የሚገልጥ እና ታሪካቸውን የሚጠብቅ።',
            heroDescription: 'ታሪክ ያስቀረቻቸውን ታሪኮች በክብር፣ በአውድ እና በዓለም አቀፍ ግንዛቤ መልሶ ማቅረብ።',
            exploreArchive: 'ማህደሩን ያስሱ',
            learnMore: 'ተጨማሪ ይወቁ',
            globalMission: 'ዓለም አቀፍ ተልዕኮ',
            worldRegions: 'የዓለም ክልሎች',
            languages: 'ቋንቋዎች',
            historicalEras: 'ታሪካዊ ዘመናት',
            categories: 'ምድቦች',
            readMore: 'ተጨማሪ ያንብቡ',
            loading: 'በመጫን ላይ...',
            noResults: 'ምንም ውጤት አልተገኘም',
            error: 'የሆነ ስህተት ተከስቷል',
            copyright: '© 2026 ወመንሳይፒዲያ ፋውንዴሽን። ሁሉም መብቶች የተጠበቁ ናቸው።',
            supportMission: 'ተልዕኳችንን ይደግፉ',
        },
        zu: {
            search: 'Sesha emlandweni...',
            donate: 'Nikela',
            signIn: 'Ngena',
            signOut: 'Phuma',
            explore: 'Hlola',
            learn: 'Funda',
            participate: 'Hlanganyela',
            about: 'Mayelana',
            home: 'Ikhaya',
            browse: 'Bhrawuza',
            featured: 'Okuvelele',
            collections: 'Imiqoqo',
            timelines: 'Izikhathi',
            education: 'Imfundo',
            registry: 'Irejista',
            enterprises: 'Amabhizinisi',
            research: 'Ucwaningo',
            publications: 'Izincwadi',
            resources: 'Izinsiza',
            nominateWoman: 'Qoka owesifazane',
            shareYourStory: 'Yabelana indaba yakho',
            aboutUs: 'Mayelana nathi',
            founders: 'Abasunguli',
            contributors: 'Abanikeli',
            contact: 'Xhumana nathi',
            myProfile: 'Iphrofayili yami',
            heroBadge: 'Iphrojekthi Yefa',
            heroTitle: 'I-encyclopedia yokuqala <em>yokuhumusha</em> yabesifazane emhlabeni — iveza ukujula, amandla, nencazelo yamasiko ngemuva kowesifazane ngamunye kanye nokulondoloza indaba yakhe.',
            heroDescription: 'Ukubuyisela izindaba umlando ezizibekelayo, ngesithunzi, umongo nombono womhlaba.',
            exploreArchive: 'Hlola umkhiqizo',
            learnMore: 'Funda kabanzi',
            globalMission: 'Umgomo womhlaba',
            worldRegions: 'Izifunda zomhlaba',
            languages: 'Izilimi',
            historicalEras: 'Izikhathi zomlando',
            categories: 'Izigaba',
            readMore: 'Funda kabanzi',
            loading: 'Iyalayisha...',
            noResults: 'Ayikho imiphumela etholakele',
            error: 'Kukhona okungahambanga kahle',
            copyright: '© 2026 Womencypedia Foundation. Wonke amalungelo agodliwe.',
            supportMission: 'Sekela umgomo wethu',
        },
    },

    /**
     * Initialize the i18n module
     */
    init() {
        // Priority: 1. URL param  2. localStorage  3. browser language  4. 'en'
        const urlParams = new URLSearchParams(window.location.search);
        const urlLocale = urlParams.get('locale') || urlParams.get('lang');

        if (urlLocale && this.isSupported(urlLocale)) {
            this.currentLocale = urlLocale;
        } else {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored && this.isSupported(stored)) {
                this.currentLocale = stored;
            } else {
                const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
                this.currentLocale = this.isSupported(browserLang) ? browserLang : 'en';
            }
        }

        // Persist
        localStorage.setItem(this.STORAGE_KEY, this.currentLocale);

        // Apply to DOM
        this.applyLocale();

        // Render language switcher if a container exists
        this.renderLanguageSwitcher();

        // Translate static UI strings on the page
        this.translatePage();

        console.log(`[i18n] Locale set to: ${this.currentLocale}`);
    },

    /**
     * Check if a locale code is supported
     */
    isSupported(code) {
        return this.supportedLocales.some(l => l.code === code);
    },

    /**
     * Get locale config object
     */
    getLocaleConfig(code) {
        return this.supportedLocales.find(l => l.code === code) || this.supportedLocales[0];
    },

    /**
     * Apply locale settings to the HTML document
     */
    applyLocale() {
        const config = this.getLocaleConfig(this.currentLocale);
        const html = document.documentElement;

        html.setAttribute('lang', this.currentLocale);
        html.setAttribute('dir', config.dir);

        // Add RTL class for CSS styling
        if (config.dir === 'rtl') {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    },

    /**
     * Switch to a new locale
     */
    switchLocale(newLocale) {
        if (!this.isSupported(newLocale) || newLocale === this.currentLocale) return;

        this.currentLocale = newLocale;
        localStorage.setItem(this.STORAGE_KEY, newLocale);

        // Apply DOM changes
        this.applyLocale();

        // Update URL with locale param
        const url = new URL(window.location);
        url.searchParams.set('locale', newLocale);
        window.history.replaceState({}, '', url);

        // Translate static strings (immediate, no reload needed)
        this.translatePage();

        // Update switcher UI
        this.renderLanguageSwitcher();

        // Dispatch event for dynamic content modules (homepage.js, browse.js, etc.)
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: newLocale } }));

        // Reload to re-fetch CMS content in new locale
        window.location.reload();
    },

    /** Loaded locale JSON data (from locales/*.json files) */
    _localeData: {},

    /**
     * Load locale JSON file from locales/ directory.
     * Merges into _localeData for the given locale code.
     */
    async _loadLocaleFile(localeCode) {
        if (this._localeData[localeCode]) return; // already loaded
        try {
            const response = await fetch(`locales/${localeCode}.json`, { cache: 'default' });
            if (response.ok) {
                this._localeData[localeCode] = await response.json();
            }
        } catch {
            // Locale file not available — will use inline translations
        }
    },

    /**
     * Check if a key resolves to an actual translation (not the raw key).
     */
    _hasTranslation(key) {
        // Check inline translations
        const localeStrings = this.translations[this.currentLocale] || {};
        if (localeStrings[key]) return true;
        if (this.translations['en'] && this.translations['en'][key]) return true;
        // Check loaded locale JSON
        const jsonData = this._localeData[this.currentLocale] || {};
        if (jsonData[key]) return true;
        const enJsonData = this._localeData['en'] || {};
        if (enJsonData[key]) return true;
        // Check stored original texts
        if (this._originalTexts[key]) return true;
        return false;
    },
    /**
     * Get a translated UI string.
     * Priority: locale JSON → inline translations → original page text → raw key (last resort)
     */
    t(key, params = {}) {
        // 1. Check loaded locale JSON files (locales/*.json)
        const jsonData = this._localeData[this.currentLocale] || {};
        const enJsonData = this._localeData['en'] || {};

        // 2. Check inline translation dictionaries
        const localeStrings = this.translations[this.currentLocale] || this.translations['en'];

        // 3. Resolve with priority chain
        let text = jsonData[key]
            || localeStrings[key]
            || enJsonData[key]
            || this.translations['en'][key]
            || this._originalTexts[key]  // preserved original HTML text
            || key; // last resort fallback

        // Simple interpolation: {{count}} → params.count
        for (const [param, value] of Object.entries(params)) {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), value);
        }

        return text;
    },

    /**
     * Translate all elements with data-i18n attributes
     * Supports: data-i18n (textContent), data-i18n-html (innerHTML),
     *           data-i18n-placeholder, data-i18n-aria, data-i18n-title
     */
    translatePage() {
        // Translate text content: data-i18n="key"
        // CRITICAL: Only replace if a real translation exists, otherwise preserve original text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && this._hasTranslation(key)) {
                el.textContent = this.t(key);
            }
            // If no translation found, leave original HTML content untouched
        });

        // Translate HTML content (for keys with <em>, <strong>, etc.): data-i18n-html="key"
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (key && this._hasTranslation(key)) {
                el.innerHTML = this.t(key);
            }
        });

        // Translate placeholders: data-i18n-placeholder="key"
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.setAttribute('placeholder', this.t(key));
            }
        });

        // Translate aria-labels: data-i18n-aria="key"
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (key) {
                el.setAttribute('aria-label', this.t(key));
            }
        });

        // Translate title attributes: data-i18n-title="key"
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.setAttribute('title', this.t(key));
            }
        });
    },

    /**
     * Render the language switcher dropdown
     */
    renderLanguageSwitcher() {
        const containers = document.querySelectorAll('#language-switcher, .language-switcher');
        if (containers.length === 0) return;

        const currentConfig = this.getLocaleConfig(this.currentLocale);

        const html = `
            <div class="relative group">
                <button 
                    class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                    aria-label="Change language"
                    id="lang-switcher-btn">
                    <span class="text-base">${currentConfig.flag}</span>
                    <span class="hidden sm:inline">${currentConfig.nativeName}</span>
                    <span class="material-symbols-outlined text-[16px] transition-transform group-hover:rotate-180">expand_more</span>
                </button>
                <div class="lang-dropdown absolute top-full right-0 mt-1 bg-white border border-border-light rounded-xl shadow-xl py-2 min-w-[200px] z-[100] hidden">
                    ${this.supportedLocales.map(locale => `
                        <button 
                            onclick="I18N.switchLocale('${locale.code}')"
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${locale.code === this.currentLocale
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-main hover:bg-primary/5 hover:text-primary'}">
                            <span class="text-base">${locale.flag}</span>
                            <span class="flex-1 text-left">${locale.nativeName}</span>
                            ${locale.code === this.currentLocale ? '<span class="material-symbols-outlined text-[16px] text-primary">check</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        containers.forEach(container => {
            container.innerHTML = html;

            const btn = container.querySelector('#lang-switcher-btn');
            const dropdown = container.querySelector('.lang-dropdown');
            if (btn && dropdown) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                });
                document.addEventListener('click', () => {
                    dropdown.classList.add('hidden');
                });
            }
        });
    },

    /**
     * Get locale-aware date string
     */
    formatDate(date, options = { year: 'numeric', month: 'long' }) {
        try {
            return new Intl.DateTimeFormat(this.currentLocale, options).format(new Date(date));
        } catch {
            return new Date(date).toLocaleDateString();
        }
    },

    /**
     * Get locale-aware number string
     */
    formatNumber(num) {
        try {
            return new Intl.NumberFormat(this.currentLocale).format(num);
        } catch {
            return num.toString();
        }
    },

    /**
     * Intercept ALL internal links to carry locale across pages.
     * Called once during init. Adds locale param to every <a href> 
     * pointing to a local .html page.
     */
    interceptAllLinks() {
        if (this.currentLocale === 'en') return; // default, no param needed

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Skip external links, anchors, javascript:, mailto:, tel:
            if (href.startsWith('http') || href.startsWith('#') ||
                href.startsWith('javascript:') || href.startsWith('mailto:') ||
                href.startsWith('tel:')) return;

            // Skip if already has locale param
            if (href.includes('locale=')) return;

            // Add locale to internal links
            const separator = href.includes('?') ? '&' : '?';
            link.setAttribute('href', `${href}${separator}locale=${this.currentLocale}`);
        });

        // Also update all links immediately for middle-click / right-click > open in new tab
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            if (href.startsWith('http') || href.startsWith('#') ||
                href.startsWith('javascript:') || href.startsWith('mailto:') ||
                href.startsWith('tel:') || href.includes('locale=')) return;

            const separator = href.includes('?') ? '&' : '?';
            link.setAttribute('href', `${href}${separator}locale=${this.currentLocale}`);
        });
    },

    /**
     * Store original English text from data-i18n elements.
     * This creates fallback translations for page-specific keys
     * that aren't in the translation dictionary yet.
     */
    _originalTexts: {},
    storeOriginalTexts() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && !this._originalTexts[key]) {
                this._originalTexts[key] = el.textContent.trim();
            }
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (key && !this._originalTexts[key]) {
                this._originalTexts[key] = el.innerHTML.trim();
            }
        });
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Store original English text BEFORE translating
    I18N.storeOriginalTexts();

    // Load locale JSON files (en.json + current locale)
    await I18N._loadLocaleFile('en');
    const urlLocale = new URLSearchParams(window.location.search).get('locale');
    const storedLocale = localStorage.getItem(I18N.STORAGE_KEY);
    const targetLocale = urlLocale || storedLocale || navigator.language?.split('-')[0] || 'en';
    if (targetLocale !== 'en' && I18N.isSupported(targetLocale)) {
        await I18N._loadLocaleFile(targetLocale);
    }

    I18N.init();
    // Intercept links AFTER init so locale is set
    I18N.interceptAllLinks();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18N;
}