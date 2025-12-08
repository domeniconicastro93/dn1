"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = getMessages;
const en = {
    common: {
        appName: 'Strike',
        tagline: 'Cloud Gaming. Instant. Social.',
        playNow: 'Play Now',
        signUp: 'Sign Up',
        signIn: 'Sign In',
        learnMore: 'Learn More',
        getStarted: 'Get Started',
    },
    nav: {
        home: 'Home',
        feed: 'Feed',
        games: 'Games',
        live: 'Live',
        clips: 'Clips',
        community: 'Community',
        pricing: 'Pricing',
    },
    home: {
        hero: {
            title: 'Play Any Game. Anywhere. Instantly.',
            subtitle: 'No downloads. No waiting. Just pure gaming powered by cloud technology.',
            cta: 'Start Playing Free',
            learnMore: 'Learn More',
        },
        features: {
            sectionTitle: 'Everything You Need',
            sectionDescription: 'Discover all the features that make Strike the ultimate cloud gaming platform.',
            viewAll: 'View All Features',
            cloudGaming: {
                title: 'Cloud Gaming',
                description: 'Play the latest AAA games instantly in your browser or mobile device.',
            },
            reels: {
                title: 'Share Your Moments',
                description: 'Create and share epic gaming moments with our TikTok-style Reels.',
            },
            social: {
                title: 'Gaming Community',
                description: 'Connect with gamers, follow creators, and discover new content.',
            },
        },
        pricing: {
            sectionTitle: 'Choose Your Plan',
            sectionDescription: 'Select the perfect plan for your gaming needs. All plans include access to our game library and social features.',
        },
        reels: {
            sectionTitle: 'Trending Reels',
            sectionDescription: 'Watch the most popular gaming moments from our community',
        },
        blog: {
            sectionTitle: 'Latest News & Updates',
            sectionDescription: 'Stay up to date with the latest gaming news, tips, and community highlights',
        },
        testimonials: {
            sectionTitle: 'What Our Users Say',
            sectionDescription: 'Join thousands of satisfied gamers who are already playing on Strike',
        },
        cta: {
            title: 'Ready to Start Gaming?',
            description: 'Join Strike today and experience the future of cloud gaming. No downloads, no waiting, just pure gaming.',
            primaryCta: 'Get Started Free',
            secondaryCta: 'View Pricing',
        },
    },
    footer: {
        about: 'About',
        careers: 'Careers',
        blog: 'Blog',
        support: 'Support',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
        cookies: 'Cookie Policy',
        copyright: '© 2024 Strike. All rights reserved.',
    },
    feed: {
        title: 'Feed',
        description: 'Discover trending gaming clips, reels, and live streams',
        tabs: {
            forYou: 'For You',
            following: 'Following',
            explore: 'Explore',
        },
    },
    beta: {
        title: 'Strike Beta',
        description: "Welcome to Strike Beta. We're working hard to bring you the best cloud gaming experience.",
        exploreGames: 'Explore Games',
    },
    games: {
        title: 'Games',
        description: 'Browse our library of 2000+ games. Play instantly in the cloud.',
        searchPlaceholder: 'Search games...',
    },
    auth: {
        login: {
            title: 'Sign In',
            description: 'Welcome back to Strike',
            submit: 'Sign In',
            forgotPassword: 'Forgot password?',
        },
        register: {
            title: 'Create Account',
            description: 'Join Strike and start gaming',
            submit: 'Sign Up',
        },
    },
    creator: {
        title: 'Creator Profile',
    },
    landing: {
        hero: {
            title: 'Play {game} - Strike Gaming Cloud',
            description: 'Play instantly in the cloud. No downloads. No waiting. Just pure gaming.',
        },
        cta: {
            startPlaying: 'Start Playing Free',
            browseGames: 'Browse Games',
            title: 'Ready to Start Gaming?',
            description: 'Join thousands of gamers playing instantly in the cloud.',
            getStarted: 'Get Started Now',
        },
        features: {
            title: 'Why Choose Strike?',
            noDownload: {
                title: 'No Downloads',
                description: 'Play instantly without downloading games. All processing happens in the cloud.',
            },
            instant: {
                title: 'Instant Access',
                description: 'Start playing in seconds. No waiting for installations or updates.',
            },
            anywhere: {
                title: 'Play Anywhere',
                description: 'Access your games from any device - PC, mobile, or tablet.',
            },
        },
        socialProof: {
            title: 'What Gamers Say',
            testimonial1: "Best cloud gaming platform I've tried. Zero lag, amazing quality!",
            user1: 'Alex M.',
            testimonial2: 'Love being able to play on my phone. Game quality is incredible.',
            user2: 'Sarah K.',
            testimonial3: 'The replay and sharing features are game-changers. Highly recommend!',
            user3: 'Mike T.',
        },
        faq: {
            title: 'Frequently Asked Questions',
            q1: 'How does cloud gaming work?',
            a1: 'Cloud gaming streams games directly to your device. All processing happens on powerful servers, so you can play high-end games on any device.',
            q2: 'Do I need a powerful computer?',
            a2: 'No! Cloud gaming works on any device with a stable internet connection. Your device just needs to display the video stream.',
            q3: 'What games are available?',
            a3: 'We offer a wide selection of AAA games and indie titles. Browse our catalog to see all available games.',
        },
    },
};
const translations = {
    en,
    it: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud Gaming. Istantaneo. Sociale.',
            playNow: 'Gioca Ora',
            signUp: 'Registrati',
            signIn: 'Accedi',
            learnMore: 'Scopri di più',
            getStarted: 'Inizia',
        },
        nav: {
            home: 'Home',
            feed: 'Feed',
            games: 'Giochi',
            live: 'Live',
            clips: 'Clip',
            community: 'Community',
            pricing: 'Prezzi',
        },
        home: {
            hero: {
                title: 'Gioca qualsiasi gioco. Ovunque. All’istante.',
                subtitle: 'Nessun download. Nessuna attesa. Solo puro gaming alimentato dal cloud.',
                cta: 'Inizia gratis',
                learnMore: 'Scopri di più',
            },
            features: {
                sectionTitle: 'Tutto ciò di cui hai bisogno',
                sectionDescription: 'Scopri tutte le funzionalità che rendono Strike la piattaforma di cloud gaming definitiva.',
                viewAll: 'Mostra tutte le funzioni',
                cloudGaming: {
                    title: 'Cloud Gaming',
                    description: 'Gioca subito agli ultimi titoli AAA dal browser o dal dispositivo mobile.',
                },
                reels: {
                    title: 'Condividi i tuoi momenti',
                    description: 'Crea e condividi clip epiche con i nostri Reels in stile TikTok.',
                },
                social: {
                    title: 'Community di gamer',
                    description: 'Connettiti con altri giocatori, segui i creator e scopri nuovi contenuti.',
                },
            },
            pricing: {
                sectionTitle: 'Scegli il tuo piano',
                sectionDescription: 'Seleziona il piano perfetto per il tuo stile di gioco. Tutti includono libreria e funzioni social.',
            },
            reels: {
                sectionTitle: 'Reel di tendenza',
                sectionDescription: 'Guarda i momenti di gioco più popolari della community',
            },
            blog: {
                sectionTitle: 'News e aggiornamenti',
                sectionDescription: 'Resta aggiornato con notizie, consigli e highlight della community',
            },
            testimonials: {
                sectionTitle: 'Cosa dicono gli utenti',
                sectionDescription: 'Unisciti a migliaia di gamer che già giocano su Strike',
            },
            cta: {
                title: 'Pronto per iniziare?',
                description: 'Unisciti oggi a Strike e vivi il futuro del cloud gaming. Niente download, niente attese.',
                primaryCta: 'Inizia gratis',
                secondaryCta: 'Guarda i prezzi',
            },
        },
        footer: {
            about: 'Chi siamo',
            careers: 'Carriere',
            blog: 'Blog',
            support: 'Supporto',
            terms: 'Termini di servizio',
            privacy: 'Privacy',
            cookies: 'Cookie',
            copyright: '© 2024 Strike. Tutti i diritti riservati.',
        },
        feed: {
            title: 'Feed',
            description: 'Scopri clip, reel e live di gaming in tendenza',
            tabs: {
                forYou: 'Per te',
                following: 'Seguiti',
                explore: 'Esplora',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Benvenuto nella beta di Strike. Stiamo lavorando per offrirti la migliore esperienza di cloud gaming.',
            exploreGames: 'Esplora i giochi',
        },
        games: {
            title: 'Giochi',
            description: 'Sfoglia la nostra libreria di oltre 2000 giochi e gioca subito nel cloud.',
            searchPlaceholder: 'Cerca giochi...',
        },
        auth: {
            login: {
                title: 'Accedi',
                description: 'Bentornato su Strike',
                submit: 'Accedi',
                forgotPassword: 'Password dimenticata?',
            },
            register: {
                title: 'Crea account',
                description: 'Unisciti a Strike e inizia a giocare',
                submit: 'Registrati',
            },
        },
        creator: {
            title: 'Profilo creator',
        },
        landing: {
            hero: {
                title: 'Gioca {game} - Strike Gaming Cloud',
                description: 'Gioca istantaneamente nel cloud. Nessun download, nessuna attesa.',
            },
            cta: {
                startPlaying: 'Inizia gratis',
                browseGames: 'Sfoglia i giochi',
                title: 'Pronto a giocare?',
                description: 'Unisciti a migliaia di gamer che giocano istantaneamente nel cloud.',
                getStarted: 'Parti ora',
            },
            features: {
                title: 'Perché scegliere Strike?',
                noDownload: {
                    title: 'Nessun download',
                    description: 'Gioca subito senza installazioni. Tutto viene elaborato nel cloud.',
                },
                instant: {
                    title: 'Accesso immediato',
                    description: 'Entra in partita in pochi secondi, senza aggiornamenti lunghi.',
                },
                anywhere: {
                    title: 'Gioca ovunque',
                    description: 'Accedi ai tuoi giochi da PC, tablet o smartphone.',
                },
            },
            socialProof: {
                title: 'Le opinioni dei gamer',
                testimonial1: 'La migliore piattaforma di cloud gaming che abbia provato!',
                user1: 'Alex M.',
                testimonial2: 'Adoro poter giocare dal telefono con una qualità incredibile.',
                user2: 'Sarah K.',
                testimonial3: 'Replay e condivisione sono fantastici. Consigliatissima!',
                user3: 'Mike T.',
            },
            faq: {
                title: 'Domande frequenti',
                q1: 'Come funziona il cloud gaming?',
                a1: 'I giochi vengono eseguiti su server potenti e trasmessi in streaming al tuo dispositivo.',
                q2: 'Serve un PC potente?',
                a2: 'No, basta una connessione stabile. Il dispositivo mostra solo il video.',
                q3: 'Quali giochi sono disponibili?',
                a3: 'Abbiamo centinaia di titoli AAA e indie. Scopri il catalogo completo.',
            },
        },
    },
    fr: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud gaming. Instantané. Social.',
            playNow: 'Jouer maintenant',
            signUp: "S'inscrire",
            signIn: 'Se connecter',
            learnMore: 'En savoir plus',
            getStarted: 'Commencer',
        },
        nav: {
            home: 'Accueil',
            feed: 'Flux',
            games: 'Jeux',
            live: 'Live',
            clips: 'Clips',
            community: 'Communauté',
            pricing: 'Tarifs',
        },
        home: {
            hero: {
                title: 'Joue à n’importe quel jeu. Partout. Instantanément.',
                subtitle: 'Pas de téléchargement, pas d’attente. Seulement du jeu pur grâce au cloud.',
                cta: 'Commencer gratuitement',
                learnMore: 'En savoir plus',
            },
            features: {
                sectionTitle: 'Tout ce dont tu as besoin',
                sectionDescription: 'Découvre toutes les fonctionnalités qui font de Strike la plateforme ultime.',
                viewAll: 'Voir toutes les fonctionnalités',
                cloudGaming: {
                    title: 'Cloud gaming',
                    description: 'Joue immédiatement aux derniers AAA depuis ton navigateur ou mobile.',
                },
                reels: {
                    title: 'Partage tes moments',
                    description: 'Crée et partage des clips épiques au format Reels.',
                },
                social: {
                    title: 'Communauté',
                    description: 'Connecte-toi aux joueurs, suis des créateurs et découvre du contenu.',
                },
            },
            pricing: {
                sectionTitle: 'Choisis ton offre',
                sectionDescription: 'Trouve la formule idéale avec jeux illimités et fonctions sociales.',
            },
            reels: {
                sectionTitle: 'Reels tendance',
                sectionDescription: 'Regarde les meilleurs moments de la communauté.',
            },
            blog: {
                sectionTitle: 'Actualités et mises à jour',
                sectionDescription: 'Reste informé des nouveautés, conseils et histoires de joueurs.',
            },
            testimonials: {
                sectionTitle: 'Ils en parlent',
                sectionDescription: 'Des milliers de joueurs utilisent déjà Strike.',
            },
            cta: {
                title: 'Prêt à jouer ?',
                description: 'Rejoins Strike et découvre le futur du cloud gaming.',
                primaryCta: 'Commencer gratuitement',
                secondaryCta: 'Voir les tarifs',
            },
        },
        footer: {
            about: 'À propos',
            careers: 'Carrières',
            blog: 'Blog',
            support: 'Support',
            terms: "Conditions d'utilisation",
            privacy: 'Confidentialité',
            cookies: 'Cookies',
            copyright: '© 2024 Strike. Tous droits réservés.',
        },
        feed: {
            title: 'Flux',
            description: 'Découvre les clips, reels et lives de gaming les plus populaires.',
            tabs: {
                forYou: 'Pour toi',
                following: 'Abonnements',
                explore: 'Explorer',
            },
        },
        beta: {
            title: 'Strike Bêta',
            description: 'Bienvenue dans la bêta de Strike. Nous peaufinons la meilleure expérience cloud.',
            exploreGames: 'Explorer les jeux',
        },
        games: {
            title: 'Jeux',
            description: 'Explore notre catalogue de plus de 2000 jeux et lance-toi instantanément.',
            searchPlaceholder: 'Rechercher un jeu...',
        },
        auth: {
            login: {
                title: 'Se connecter',
                description: 'Heureux de te revoir sur Strike',
                submit: 'Connexion',
                forgotPassword: 'Mot de passe oublié ?',
            },
            register: {
                title: 'Créer un compte',
                description: 'Rejoins Strike et commence à jouer',
                submit: "S'inscrire",
            },
        },
        creator: {
            title: 'Profil créateur',
        },
        landing: {
            hero: {
                title: 'Joue à {game} - Strike Gaming Cloud',
                description: 'Lance-toi instantanément dans le cloud. Pas de téléchargements.',
            },
            cta: {
                startPlaying: 'Commencer gratuitement',
                browseGames: 'Voir les jeux',
                title: 'Envie de jouer ?',
                description: 'Rejoins des milliers de joueurs actifs dans le cloud.',
                getStarted: 'Commencer',
            },
            features: {
                title: 'Pourquoi Strike ?',
                noDownload: {
                    title: 'Sans téléchargement',
                    description: 'Tout tourne sur le cloud, ton appareil reçoit juste le flux.',
                },
                instant: {
                    title: 'Accès immédiat',
                    description: 'Lance un jeu en quelques secondes sans mises à jour.',
                },
                anywhere: {
                    title: 'Partout avec toi',
                    description: 'Joue depuis ton PC, ton téléphone ou ta tablette.',
                },
            },
            socialProof: {
                title: 'Avis des joueurs',
                testimonial1: 'La meilleure plateforme cloud que j’ai testée. Zéro lag !',
                user1: 'Alex M.',
                testimonial2: 'Je peux jouer sur mon téléphone avec une qualité folle.',
                user2: 'Sarah K.',
                testimonial3: 'Les replays et le partage sont incroyables.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'FAQ',
                q1: 'Comment fonctionne le cloud gaming ?',
                a1: 'Le jeu tourne sur des serveurs distants et est diffusé sur ton appareil.',
                q2: 'Faut-il un PC puissant ?',
                a2: 'Non, une bonne connexion suffit.',
                q3: 'Quels jeux proposez-vous ?',
                a3: 'Un vaste choix de AAA et d’indés. Consulte le catalogue.',
            },
        },
    },
    es: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud gaming. Instantáneo. Social.',
            playNow: 'Jugar ahora',
            signUp: 'Registrarse',
            signIn: 'Iniciar sesión',
            learnMore: 'Más información',
            getStarted: 'Comenzar',
        },
        nav: {
            home: 'Inicio',
            feed: 'Feed',
            games: 'Juegos',
            live: 'En vivo',
            clips: 'Clips',
            community: 'Comunidad',
            pricing: 'Precios',
        },
        home: {
            hero: {
                title: 'Juega cualquier juego. Donde sea. Al instante.',
                subtitle: 'Sin descargas ni esperas. Solo gaming puro impulsado por la nube.',
                cta: 'Empieza gratis',
                learnMore: 'Descubre más',
            },
            features: {
                sectionTitle: 'Todo lo que necesitas',
                sectionDescription: 'Conoce las funciones que hacen de Strike la plataforma definitiva.',
                viewAll: 'Ver todas las funciones',
                cloudGaming: {
                    title: 'Cloud gaming',
                    description: 'Juega a los últimos AAA al instante desde tu navegador o móvil.',
                },
                reels: {
                    title: 'Comparte tus momentos',
                    description: 'Crea y comparte clips épicos con nuestros Reels estilo TikTok.',
                },
                social: {
                    title: 'Comunidad gamer',
                    description: 'Conecta con jugadores, sigue creadores y descubre contenido.',
                },
            },
            pricing: {
                sectionTitle: 'Elige tu plan',
                sectionDescription: 'Planes flexibles con acceso total a biblioteca y funciones sociales.',
            },
            reels: {
                sectionTitle: 'Reels en tendencia',
                sectionDescription: 'Mira los mejores momentos de la comunidad.',
            },
            blog: {
                sectionTitle: 'Noticias y actualizaciones',
                sectionDescription: 'Mantente al día con novedades, consejos y destacados.',
            },
            testimonials: {
                sectionTitle: 'Lo que dicen los jugadores',
                sectionDescription: 'Miles de gamers ya disfrutan de Strike.',
            },
            cta: {
                title: '¿Listo para jugar?',
                description: 'Únete hoy y experimenta el futuro del cloud gaming.',
                primaryCta: 'Comenzar gratis',
                secondaryCta: 'Ver precios',
            },
        },
        footer: {
            about: 'Acerca de',
            careers: 'Empleos',
            blog: 'Blog',
            support: 'Soporte',
            terms: 'Términos',
            privacy: 'Privacidad',
            cookies: 'Cookies',
            copyright: '© 2024 Strike. Todos los derechos reservados.',
        },
        feed: {
            title: 'Feed',
            description: 'Descubre clips, reels y directos de gaming que marcan tendencia.',
            tabs: {
                forYou: 'Para ti',
                following: 'Siguiendo',
                explore: 'Explorar',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Bienvenido a la beta de Strike. Estamos mejorando la mejor experiencia en la nube.',
            exploreGames: 'Explorar juegos',
        },
        games: {
            title: 'Juegos',
            description: 'Revisa nuestra biblioteca de más de 2000 juegos y juega al instante.',
            searchPlaceholder: 'Buscar juegos...',
        },
        auth: {
            login: {
                title: 'Iniciar sesión',
                description: 'Bienvenido de nuevo a Strike',
                submit: 'Entrar',
                forgotPassword: '¿Olvidaste tu contraseña?',
            },
            register: {
                title: 'Crear cuenta',
                description: 'Únete a Strike y empieza a jugar',
                submit: 'Registrarse',
            },
        },
        creator: {
            title: 'Perfil del creador',
        },
        landing: {
            hero: {
                title: 'Juega {game} - Strike Gaming Cloud',
                description: 'Disfruta del juego al instante sin descargas ni esperas.',
            },
            cta: {
                startPlaying: 'Empieza gratis',
                browseGames: 'Ver juegos',
                title: '¿Preparado para jugar?',
                description: 'Miles de jugadores ya disfrutan del cloud gaming.',
                getStarted: 'Comenzar ahora',
            },
            features: {
                title: '¿Por qué Strike?',
                noDownload: {
                    title: 'Sin descargas',
                    description: 'Todo se ejecuta en la nube, tu dispositivo solo recibe el streaming.',
                },
                instant: {
                    title: 'Acceso instantáneo',
                    description: 'Inicia una partida en segundos sin instalaciones.',
                },
                anywhere: {
                    title: 'Juega donde quieras',
                    description: 'Accede desde PC, tablet o móvil.',
                },
            },
            socialProof: {
                title: 'Opiniones reales',
                testimonial1: 'La mejor plataforma de cloud gaming que he probado.',
                user1: 'Alex M.',
                testimonial2: 'Calidad increíble incluso desde el teléfono.',
                user2: 'Sarah K.',
                testimonial3: 'Las funciones de replay y compartir son únicas.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'Preguntas frecuentes',
                q1: '¿Cómo funciona el cloud gaming?',
                a1: 'El juego se ejecuta en servidores potentes y se transmite a tu dispositivo.',
                q2: '¿Necesito un PC potente?',
                a2: 'No, solo una buena conexión a Internet.',
                q3: '¿Qué juegos hay disponibles?',
                a3: 'Contamos con títulos AAA e indie. Consulta el catálogo.',
            },
        },
    },
    de: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud-Gaming. Sofort. Sozial.',
            playNow: 'Jetzt spielen',
            signUp: 'Registrieren',
            signIn: 'Anmelden',
            learnMore: 'Mehr erfahren',
            getStarted: 'Loslegen',
        },
        nav: {
            home: 'Start',
            feed: 'Feed',
            games: 'Spiele',
            live: 'Live',
            clips: 'Clips',
            community: 'Community',
            pricing: 'Preise',
        },
        home: {
            hero: {
                title: 'Spiele jedes Game. Überall. Sofort.',
                subtitle: 'Keine Downloads, kein Warten. Nur pures Cloud-Gaming.',
                cta: 'Gratis starten',
                learnMore: 'Mehr erfahren',
            },
            features: {
                sectionTitle: 'Alles, was du brauchst',
                sectionDescription: 'Entdecke alle Funktionen von Strike, der ultimativen Cloud-Plattform.',
                viewAll: 'Alle Funktionen anzeigen',
                cloudGaming: {
                    title: 'Cloud Gaming',
                    description: 'Spiele die neuesten AAA-Titel sofort im Browser oder auf dem Handy.',
                },
                reels: {
                    title: 'Teile Momente',
                    description: 'Erstelle epische Clips mit unseren TikTok-ähnlichen Reels.',
                },
                social: {
                    title: 'Gaming-Community',
                    description: 'Vernetze dich mit Spieler:innen, folge Creators und entdecke Content.',
                },
            },
            pricing: {
                sectionTitle: 'Wähle deinen Plan',
                sectionDescription: 'Flexible Pakete mit voller Bibliothek und Social-Features.',
            },
            reels: {
                sectionTitle: 'Beliebte Reels',
                sectionDescription: 'Sieh dir die Highlights der Community an.',
            },
            blog: {
                sectionTitle: 'News & Updates',
                sectionDescription: 'Bleib informiert über Gaming-News, Tipps und Stories.',
            },
            testimonials: {
                sectionTitle: 'Stimmen aus der Community',
                sectionDescription: 'Tausende Spieler nutzen bereits Strike.',
            },
            cta: {
                title: 'Bereit zum Spielen?',
                description: 'Erlebe die Zukunft des Cloud-Gamings – ohne Downloads.',
                primaryCta: 'Gratis starten',
                secondaryCta: 'Preise ansehen',
            },
        },
        footer: {
            about: 'Über uns',
            careers: 'Jobs',
            blog: 'Blog',
            support: 'Support',
            terms: 'Nutzungsbedingungen',
            privacy: 'Datenschutz',
            cookies: 'Cookies',
            copyright: '© 2024 Strike. Alle Rechte vorbehalten.',
        },
        feed: {
            title: 'Feed',
            description: 'Entdecke angesagte Gaming-Clips, Reels und Livestreams.',
            tabs: {
                forYou: 'Für dich',
                following: 'Folge ich',
                explore: 'Entdecken',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Willkommen in der Strike-Beta. Wir feilen an der besten Cloud-Erfahrung.',
            exploreGames: 'Spiele entdecken',
        },
        games: {
            title: 'Spiele',
            description: 'Durchstöbere über 2000 Spiele und starte sofort im Cloud-Stream.',
            searchPlaceholder: 'Spiele suchen...',
        },
        auth: {
            login: {
                title: 'Anmelden',
                description: 'Schön, dich wiederzusehen!',
                submit: 'Einloggen',
                forgotPassword: 'Passwort vergessen?',
            },
            register: {
                title: 'Konto erstellen',
                description: 'Werde Teil von Strike und spiel los',
                submit: 'Registrieren',
            },
        },
        creator: {
            title: 'Creator-Profil',
        },
        landing: {
            hero: {
                title: 'Spiele {game} – Strike Gaming Cloud',
                description: 'Starte sofort im Cloud-Stream – ohne Installation.',
            },
            cta: {
                startPlaying: 'Gratis starten',
                browseGames: 'Spiele ansehen',
                title: 'Loslegen?',
                description: 'Tritt tausenden Cloud-Spielern bei.',
                getStarted: 'Jetzt starten',
            },
            features: {
                title: 'Warum Strike?',
                noDownload: {
                    title: 'Keine Downloads',
                    description: 'Alles läuft im Rechenzentrum, dein Gerät streamt nur.',
                },
                instant: {
                    title: 'Sofortiger Zugriff',
                    description: 'Starte Spiele in Sekunden statt Minuten.',
                },
                anywhere: {
                    title: 'Überall spielen',
                    description: 'Greif von PC, Tablet oder Smartphone zu.',
                },
            },
            socialProof: {
                title: 'Spielermeinungen',
                testimonial1: 'Beste Cloud-Plattform mit null Latenz.',
                user1: 'Alex M.',
                testimonial2: 'Fantastische Qualität selbst am Handy.',
                user2: 'Sarah K.',
                testimonial3: 'Replays und Sharing sind top.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'FAQ',
                q1: 'Wie funktioniert Cloud-Gaming?',
                a1: 'Die Spiele laufen auf Servern und werden zu dir gestreamt.',
                q2: 'Brauche ich einen starken PC?',
                a2: 'Nein, eine stabile Leitung reicht.',
                q3: 'Welche Spiele gibt es?',
                a3: 'Viele AAA- und Indie-Titel – stöbere im Katalog.',
            },
        },
    },
    pt: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud gaming. Instantâneo. Social.',
            playNow: 'Jogar agora',
            signUp: 'Criar conta',
            signIn: 'Entrar',
            learnMore: 'Saiba mais',
            getStarted: 'Começar',
        },
        nav: {
            home: 'Início',
            feed: 'Feed',
            games: 'Jogos',
            live: 'Ao vivo',
            clips: 'Clipes',
            community: 'Comunidade',
            pricing: 'Planos',
        },
        home: {
            hero: {
                title: 'Jogue qualquer jogo. Em qualquer lugar. Na hora.',
                subtitle: 'Sem downloads ou filas. Apenas diversão com tecnologia em nuvem.',
                cta: 'Comece grátis',
                learnMore: 'Descubra mais',
            },
            features: {
                sectionTitle: 'Tudo que você precisa',
                sectionDescription: 'Conheça os recursos que tornam o Strike a melhor plataforma.',
                viewAll: 'Ver recursos',
                cloudGaming: {
                    title: 'Cloud gaming',
                    description: 'Jogue os últimos AAA no navegador ou celular instantaneamente.',
                },
                reels: {
                    title: 'Compartilhe momentos',
                    description: 'Crie e compartilhe clipes épicos no formato Reels.',
                },
                social: {
                    title: 'Comunidade gamer',
                    description: 'Conecte-se com jogadores, siga criadores e descubra conteúdo.',
                },
            },
            pricing: {
                sectionTitle: 'Escolha seu plano',
                sectionDescription: 'Planos flexíveis com biblioteca e recursos sociais inclusos.',
            },
            reels: {
                sectionTitle: 'Reels em alta',
                sectionDescription: 'Veja os melhores momentos da comunidade.',
            },
            blog: {
                sectionTitle: 'Notícias e atualizações',
                sectionDescription: 'Mantenha-se informado sobre games, dicas e histórias.',
            },
            testimonials: {
                sectionTitle: 'Opinião dos jogadores',
                sectionDescription: 'Milhares de gamers já usam o Strike todos os dias.',
            },
            cta: {
                title: 'Pronto para começar?',
                description: 'Entre para o Strike e experimente o futuro do cloud gaming.',
                primaryCta: 'Começar grátis',
                secondaryCta: 'Ver planos',
            },
        },
        footer: {
            about: 'Sobre',
            careers: 'Carreiras',
            blog: 'Blog',
            support: 'Suporte',
            terms: 'Termos',
            privacy: 'Privacidade',
            cookies: 'Cookies',
            copyright: '© 2024 Strike. Todos os direitos reservados.',
        },
        feed: {
            title: 'Feed',
            description: 'Descubra clipes, reels e transmissões populares.',
            tabs: {
                forYou: 'Para você',
                following: 'Seguindo',
                explore: 'Explorar',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Bem-vindo à versão beta do Strike. Estamos refinando a melhor experiência.',
            exploreGames: 'Explorar jogos',
        },
        games: {
            title: 'Jogos',
            description: 'Explore nossa biblioteca com mais de 2000 títulos e jogue na nuvem.',
            searchPlaceholder: 'Buscar jogos...',
        },
        auth: {
            login: {
                title: 'Entrar',
                description: 'Que bom ver você de volta!',
                submit: 'Entrar',
                forgotPassword: 'Esqueceu a senha?',
            },
            register: {
                title: 'Criar conta',
                description: 'Junte-se ao Strike e jogue sem limites',
                submit: 'Cadastrar',
            },
        },
        creator: {
            title: 'Perfil do criador',
        },
        landing: {
            hero: {
                title: 'Jogue {game} - Strike Gaming Cloud',
                description: 'Entre no jogo em segundos. Nada de instalações ou atualizações.',
            },
            cta: {
                startPlaying: 'Comece grátis',
                browseGames: 'Ver jogos',
                title: 'Vamos jogar?',
                description: 'Milhares já aproveitam o cloud gaming do Strike.',
                getStarted: 'Começar agora',
            },
            features: {
                title: 'Por que Strike?',
                noDownload: {
                    title: 'Sem downloads',
                    description: 'Tudo roda na nuvem, seu dispositivo só recebe o streaming.',
                },
                instant: {
                    title: 'Acesso instantâneo',
                    description: 'Inicie partidas em poucos segundos.',
                },
                anywhere: {
                    title: 'Jogue em qualquer lugar',
                    description: 'Acesse do PC, tablet ou smartphone.',
                },
            },
            socialProof: {
                title: 'Depoimentos',
                testimonial1: 'A melhor plataforma de cloud gaming que já testei.',
                user1: 'Alex M.',
                testimonial2: 'Adoro jogar no celular com essa qualidade.',
                user2: 'Sarah K.',
                testimonial3: 'Replays e compartilhamento incríveis!',
                user3: 'Mike T.',
            },
            faq: {
                title: 'Perguntas frequentes',
                q1: 'Como funciona o cloud gaming?',
                a1: 'Os jogos rodam em servidores e são transmitidos em streaming.',
                q2: 'Preciso de um PC potente?',
                a2: 'Não. Basta uma conexão estável.',
                q3: 'Quais jogos estão disponíveis?',
                a3: 'Temos AAA e indies. Confira o catálogo completo.',
            },
        },
    },
    ko: {
        common: {
            appName: 'Strike',
            tagline: '클라우드 게이밍. 즉시. 소셜.',
            playNow: '지금 플레이',
            signUp: '회원가입',
            signIn: '로그인',
            learnMore: '자세히 보기',
            getStarted: '시작하기',
        },
        nav: {
            home: '홈',
            feed: '피드',
            games: '게임',
            live: '라이브',
            clips: '클립',
            community: '커뮤니티',
            pricing: '요금제',
        },
        home: {
            hero: {
                title: '어디서나 어떤 게임이든 즉시 플레이.',
                subtitle: '다운로드와 대기 없이 클라우드 기술로 즐기는 순수한 게임.',
                cta: '무료로 시작',
                learnMore: '더 알아보기',
            },
            features: {
                sectionTitle: '필요한 모든 기능',
                sectionDescription: 'Strike가 최고의 클라우드 플랫폼인 이유를 확인하세요.',
                viewAll: '모든 기능 보기',
                cloudGaming: {
                    title: '클라우드 게이밍',
                    description: '최신 AAA 게임을 브라우저와 모바일에서 즉시 플레이.',
                },
                reels: {
                    title: '순간 공유',
                    description: '틱톡 스타일 Reels로 멋진 순간을 기록하고 공유하세요.',
                },
                social: {
                    title: '게이머 커뮤니티',
                    description: '게이머와 소통하고 크리에이터를 팔로우하며 새 콘텐츠 발견.',
                },
            },
            pricing: {
                sectionTitle: '요금제 선택',
                sectionDescription: '게임 라이브러리와 소셜 기능이 포함된 맞춤 요금제.',
            },
            reels: {
                sectionTitle: '트렌딩 Reels',
                sectionDescription: '커뮤니티에서 가장 화제인 순간을 감상하세요.',
            },
            blog: {
                sectionTitle: '뉴스 & 업데이트',
                sectionDescription: '최신 게임 소식과 팁, 커뮤니티 소식을 확인하세요.',
            },
            testimonials: {
                sectionTitle: '유저 후기',
                sectionDescription: '수많은 게이머가 이미 Strike를 사용 중입니다.',
            },
            cta: {
                title: '지금 바로 시작할 준비 되셨나요?',
                description: '지금 Strike에 합류해 클라우드 게이밍의 미래를 경험하세요.',
                primaryCta: '무료 시작',
                secondaryCta: '요금제 보기',
            },
        },
        footer: {
            about: '소개',
            careers: '채용',
            blog: '블로그',
            support: '지원',
            terms: '이용약관',
            privacy: '개인정보 보호정책',
            cookies: '쿠키 정책',
            copyright: '© 2024 Strike. All rights reserved.',
        },
        feed: {
            title: '피드',
            description: '인기 있는 게임 클립, 릴, 라이브 스트림을 만나보세요.',
            tabs: {
                forYou: '추천',
                following: '팔로잉',
                explore: '탐색',
            },
        },
        beta: {
            title: 'Strike 베타',
            description: 'Strike 베타에 오신 것을 환영합니다. 최고의 경험을 만들고 있습니다.',
            exploreGames: '게임 살펴보기',
        },
        games: {
            title: '게임',
            description: '2,000개 이상의 게임 라이브러리를 둘러보고 즉시 플레이하세요.',
            searchPlaceholder: '게임 검색...',
        },
        auth: {
            login: {
                title: '로그인',
                description: '다시 만나서 반가워요!',
                submit: '로그인',
                forgotPassword: '비밀번호를 잊으셨나요?',
            },
            register: {
                title: '계정 만들기',
                description: 'Strike와 함께 새로운 게임 여정을 시작하세요.',
                submit: '가입하기',
            },
        },
        creator: {
            title: '크리에이터 프로필',
        },
        landing: {
            hero: {
                title: '{game} 플레이 - Strike Gaming Cloud',
                description: '설치 없이 클라우드에서 즉시 플레이하세요.',
            },
            cta: {
                startPlaying: '무료 시작',
                browseGames: '게임 보기',
                title: '지금 플레이하세요',
                description: '수많은 게이머가 클라우드에서 플레이하고 있습니다.',
                getStarted: '시작하기',
            },
            features: {
                title: 'Strike를 선택해야 하는 이유',
                noDownload: {
                    title: '다운로드 없음',
                    description: '모든 연산은 클라우드에서 처리됩니다.',
                },
                instant: {
                    title: '즉시 접속',
                    description: '설치나 업데이트 없이 바로 플레이.',
                },
                anywhere: {
                    title: '어디서나 플레이',
                    description: 'PC, 태블릿, 스마트폰 어디에서나 즐기세요.',
                },
            },
            socialProof: {
                title: '유저 평가',
                testimonial1: '지연 없는 최고의 클라우드 플랫폼!',
                user1: 'Alex M.',
                testimonial2: '휴대폰에서도 놀라운 화질입니다.',
                user2: 'Sarah K.',
                testimonial3: '리플레이와 공유 기능이 최고예요.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'FAQ',
                q1: '클라우드 게이밍은 어떻게 작동하나요?',
                a1: '게임은 서버에서 실행되고 영상만 기기로 전송됩니다.',
                q2: '고성능 PC가 필요한가요?',
                a2: '아니요. 안정적인 인터넷만 있으면 됩니다.',
                q3: '어떤 게임을 제공하나요?',
                a3: 'AAA부터 인디까지 다양한 게임을 제공합니다.',
            },
        },
    },
    th: {
        common: {
            appName: 'Strike',
            tagline: 'คลาวด์เกมมิ่ง ทันที โซเชียล',
            playNow: 'เล่นเลย',
            signUp: 'สมัครสมาชิก',
            signIn: 'เข้าสู่ระบบ',
            learnMore: 'เรียนรู้เพิ่มเติม',
            getStarted: 'เริ่มต้น',
        },
        nav: {
            home: 'หน้าแรก',
            feed: 'ฟีด',
            games: 'เกม',
            live: 'ไลฟ์',
            clips: 'คลิป',
            community: 'ชุมชน',
            pricing: 'แพ็กเกจ',
        },
        home: {
            hero: {
                title: 'เล่นเกมไหนก็ได้ ทุกที่ ทุกเวลา',
                subtitle: 'ไม่ต้องดาวน์โหลด ไม่ต้องรอ สนุกได้ทันทีด้วยพลังคลาวด์.',
                cta: 'เริ่มฟรี',
                learnMore: 'ดูรายละเอียด',
            },
            features: {
                sectionTitle: 'ครบทุกความต้องการ',
                sectionDescription: 'ค้นพบฟีเจอร์ที่ทำให้ Strike เป็นแพลตฟอร์มที่ดีที่สุด.',
                viewAll: 'ดูฟีเจอร์ทั้งหมด',
                cloudGaming: {
                    title: 'คลาวด์เกมมิ่ง',
                    description: 'เล่นเกม AAA ล่าสุดผ่านเบราว์เซอร์หรือมือถือทันที.',
                },
                reels: {
                    title: 'แบ่งปันช่วงเวลา',
                    description: 'สร้างและแชร์คลิปมัน ๆ ด้วย Reels สไตล์ TikTok.',
                },
                social: {
                    title: 'คอมมูนิตี้เกมเมอร์',
                    description: 'เชื่อมต่อกับเพื่อนเกมเมอร์และค้นหาเนื้อหาใหม่ ๆ.',
                },
            },
            pricing: {
                sectionTitle: 'เลือกแพ็กเกจ',
                sectionDescription: 'ทุกแพ็กเกจมาพร้อมคลังเกมและฟีเจอร์โซเชียลครบถ้วน.',
            },
            reels: {
                sectionTitle: 'Reels ยอดนิยม',
                sectionDescription: 'ชมไฮไลต์สุดฮิตจากคอมมูนิตี้.',
            },
            blog: {
                sectionTitle: 'ข่าวสาร & อัปเดต',
                sectionDescription: 'อัปเดตเทรนด์เกมและเรื่องราวจากผู้เล่น.',
            },
            testimonials: {
                sectionTitle: 'เสียงจากผู้เล่น',
                sectionDescription: 'ผู้เล่นนับพันเลือก Strike ทุกวัน.',
            },
            cta: {
                title: 'พร้อมเล่นแล้วหรือยัง?',
                description: 'เข้าร่วม Strike วันนี้และสัมผัสอนาคตของการเล่นเกม.',
                primaryCta: 'เริ่มฟรี',
                secondaryCta: 'ดูแพ็กเกจ',
            },
        },
        footer: {
            about: 'เกี่ยวกับ',
            careers: 'ร่วมงานกับเรา',
            blog: 'บล็อก',
            support: 'ศูนย์ช่วยเหลือ',
            terms: 'เงื่อนไข',
            privacy: 'ความเป็นส่วนตัว',
            cookies: 'คุกกี้',
            copyright: '© 2024 Strike. สงวนลิขสิทธิ์.',
        },
        feed: {
            title: 'ฟีด',
            description: 'พบคลิป Reels และสตรีมเกมยอดนิยม.',
            tabs: {
                forYou: 'สำหรับคุณ',
                following: 'กำลังติดตาม',
                explore: 'สำรวจ',
            },
        },
        beta: {
            title: 'Strike รุ่นเบต้า',
            description: 'ยินดีต้อนรับสู่เวอร์ชันเบต้าที่เรากำลังพัฒนาอย่างเต็มที่.',
            exploreGames: 'ดูรายชื่อเกม',
        },
        games: {
            title: 'เกม',
            description: 'สำรวจคลังเกมกว่า 2000 รายการและเล่นทันทีบนคลาวด์.',
            searchPlaceholder: 'ค้นหาเกม...',
        },
        auth: {
            login: {
                title: 'เข้าสู่ระบบ',
                description: 'ยินดีต้อนรับกลับ!',
                submit: 'เข้าสู่ระบบ',
                forgotPassword: 'ลืมรหัสผ่าน?',
            },
            register: {
                title: 'สร้างบัญชี',
                description: 'เข้าร่วม Strike และเริ่มเล่นทันที',
                submit: 'สมัครสมาชิก',
            },
        },
        creator: {
            title: 'โปรไฟล์ครีเอเตอร์',
        },
        landing: {
            hero: {
                title: 'เล่น {game} บน Strike Gaming Cloud',
                description: 'เล่นได้ทันทีโดยไม่ต้องติดตั้ง.',
            },
            cta: {
                startPlaying: 'เริ่มเล่นฟรี',
                browseGames: 'ดูเกม',
                title: 'มาเริ่มกันเลย',
                description: 'ผู้เล่นจำนวนมากกำลังเล่นผ่านคลาวด์ของเรา.',
                getStarted: 'เริ่มตอนนี้',
            },
            features: {
                title: 'ทำไมต้อง Strike?',
                noDownload: {
                    title: 'ไม่ต้องดาวน์โหลด',
                    description: 'ทุกอย่างประมวลผลบนคลาวด์โดยตรง.',
                },
                instant: {
                    title: 'เข้าถึงทันที',
                    description: 'เข้าสู่เกมในไม่กี่วินาที.',
                },
                anywhere: {
                    title: 'เล่นได้ทุกที่',
                    description: 'รองรับทั้งพีซี แท็บเล็ต และมือถือ.',
                },
            },
            socialProof: {
                title: 'รีวิวผู้เล่น',
                testimonial1: 'แพลตฟอร์มคลาวด์ที่ดีที่สุด ไม่มีแลค.',
                user1: 'Alex M.',
                testimonial2: 'เล่นบนมือถือก็ยังคมชัดสุด ๆ.',
                user2: 'Sarah K.',
                testimonial3: 'ระบบรีเพลย์และแชร์ยอดเยี่ยมมาก.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'คำถามที่พบบ่อย',
                q1: 'คลาวด์เกมมิ่งทำงานอย่างไร?',
                a1: 'เกมรันบนเซิร์ฟเวอร์และสตรีมมายังอุปกรณ์ของคุณ.',
                q2: 'ต้องใช้เครื่องแรงไหม?',
                a2: 'ไม่ต้อง ใช้อินเทอร์เน็ตเสถียรก็พอ.',
                q3: 'มีเกมอะไรบ้าง?',
                a3: 'มีทั้ง AAA และอินดี้มากมาย ลองดูแคตตาล็อกได้เลย.',
            },
        },
    },
    tr: {
        common: {
            appName: 'Strike',
            tagline: 'Bulut oyun. Anında. Sosyal.',
            playNow: 'Hemen oyna',
            signUp: 'Kayıt ol',
            signIn: 'Giriş yap',
            learnMore: 'Daha fazla bilgi',
            getStarted: 'Başla',
        },
        nav: {
            home: 'Ana sayfa',
            feed: 'Akış',
            games: 'Oyunlar',
            live: 'Canlı',
            clips: 'Klipler',
            community: 'Topluluk',
            pricing: 'Fiyatlar',
        },
        home: {
            hero: {
                title: 'İstediğin oyunu her yerde, anında oyna.',
                subtitle: 'İndirme yok, bekleme yok. Bulut teknolojisiyle saf oyun keyfi.',
                cta: 'Ücretsiz başla',
                learnMore: 'Daha fazlası',
            },
            features: {
                sectionTitle: 'Tüm ihtiyaçların',
                sectionDescription: 'Strike’ı benzersiz yapan özellikleri keşfet.',
                viewAll: 'Tüm özellikler',
                cloudGaming: {
                    title: 'Bulut oyun',
                    description: 'Son AAA oyunları anında tarayıcı veya mobilde oyna.',
                },
                reels: {
                    title: 'Anını paylaş',
                    description: 'TikTok tarzı Reels ile efsane anları paylaş.',
                },
                social: {
                    title: 'Oyun topluluğu',
                    description: 'Oyuncularla tanış, içerik keşfet, yaratıcıları takip et.',
                },
            },
            pricing: {
                sectionTitle: 'Planını seç',
                sectionDescription: 'Tüm planlar oyun kütüphanesi ve sosyal özelliklere erişim sağlar.',
            },
            reels: {
                sectionTitle: 'Trend Reels',
                sectionDescription: 'Topluluktaki popüler klipleri izle.',
            },
            blog: {
                sectionTitle: 'Haberler & güncellemeler',
                sectionDescription: 'Oyun haberleri, ipuçları ve topluluk öne çıkanlarını takip et.',
            },
            testimonials: {
                sectionTitle: 'Kullanıcı yorumları',
                sectionDescription: 'Binlerce oyuncu Strike’ı tercih ediyor.',
            },
            cta: {
                title: 'Oyuna hazır mısın?',
                description: 'Strike ile bulut oyun geleceğini deneyimle.',
                primaryCta: 'Ücretsiz başla',
                secondaryCta: 'Fiyatları gör',
            },
        },
        footer: {
            about: 'Hakkımızda',
            careers: 'Kariyer',
            blog: 'Blog',
            support: 'Destek',
            terms: 'Kullanım şartları',
            privacy: 'Gizlilik',
            cookies: 'Çerez politikası',
            copyright: '© 2024 Strike. Tüm hakları saklıdır.',
        },
        feed: {
            title: 'Akış',
            description: 'Trend olan oyun kliplerini, reels ve canlı yayınları keşfet.',
            tabs: {
                forYou: 'Senin için',
                following: 'Takip edilen',
                explore: 'Keşfet',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Strike betaya hoş geldin. En iyi deneyimi hazırlıyoruz.',
            exploreGames: 'Oyunları keşfet',
        },
        games: {
            title: 'Oyunlar',
            description: '2000’den fazla oyunu incele ve hemen oyna.',
            searchPlaceholder: 'Oyun ara...',
        },
        auth: {
            login: {
                title: 'Giriş yap',
                description: 'Tekrar hoş geldin!',
                submit: 'Giriş yap',
                forgotPassword: 'Şifreni mi unuttun?',
            },
            register: {
                title: 'Hesap oluştur',
                description: 'Strike’a katıl ve hemen oynamaya başla',
                submit: 'Kayıt ol',
            },
        },
        creator: {
            title: 'Yaratıcı profili',
        },
        landing: {
            hero: {
                title: '{game} oyna - Strike Gaming Cloud',
                description: 'Kurulum yok, bekleme yok. Bulutta anında başla.',
            },
            cta: {
                startPlaying: 'Ücretsiz oyna',
                browseGames: 'Oyunlara göz at',
                title: 'Hazır mısın?',
                description: 'Binlerce oyuncu bulut üzerinden oynuyor.',
                getStarted: 'Hemen başla',
            },
            features: {
                title: 'Neden Strike?',
                noDownload: {
                    title: 'İndirme yok',
                    description: 'Tüm işlem bulutta, cihazın sadece yayın alır.',
                },
                instant: {
                    title: 'Anında erişim',
                    description: 'Dakikalar değil saniyeler içinde oyuna gir.',
                },
                anywhere: {
                    title: 'Her yerde oyna',
                    description: 'PC, tablet veya telefondan eriş.',
                },
            },
            socialProof: {
                title: 'Oyuncular ne diyor?',
                testimonial1: 'Denediğim en iyi bulut platformu, gecikme yok.',
                user1: 'Alex M.',
                testimonial2: 'Telefonda bile inanılmaz kalite.',
                user2: 'Sarah K.',
                testimonial3: 'Replay ve paylaşım özellikleri harika.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'Sık sorulan sorular',
                q1: 'Bulut oyun nasıl çalışıyor?',
                a1: 'Oyunlar sunucularda çalışır ve sana video olarak aktarılır.',
                q2: 'Güçlü bir PC gerekir mi?',
                a2: 'Hayır, iyi bir internet bağlantısı yeterlidir.',
                q3: 'Hangi oyunlar mevcut?',
                a3: 'AAA ve indie oyunların geniş bir seçkisi var.',
            },
        },
    },
    pl: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud gaming. Natychmiast. Społecznie.',
            playNow: 'Graj teraz',
            signUp: 'Zarejestruj się',
            signIn: 'Zaloguj się',
            learnMore: 'Dowiedz się więcej',
            getStarted: 'Zaczynamy',
        },
        nav: {
            home: 'Start',
            feed: 'Kanał',
            games: 'Gry',
            live: 'Na żywo',
            clips: 'Klipy',
            community: 'Społeczność',
            pricing: 'Cennik',
        },
        home: {
            hero: {
                title: 'Graj w dowolną grę. Wszędzie. Od razu.',
                subtitle: 'Bez pobierania i czekania. Czysta rozgrywka dzięki chmurze.',
                cta: 'Rozpocznij za darmo',
                learnMore: 'Dowiedz się więcej',
            },
            features: {
                sectionTitle: 'Wszystko, czego potrzebujesz',
                sectionDescription: 'Poznaj funkcje, które czynią Strike najlepszą platformą chmurową.',
                viewAll: 'Zobacz funkcje',
                cloudGaming: {
                    title: 'Cloud gaming',
                    description: 'Graj w najnowsze tytuły AAA w przeglądarce lub na telefonie.',
                },
                reels: {
                    title: 'Dziel się momentami',
                    description: 'Twórz i udostępniaj epickie klipy w formacie Reels.',
                },
                social: {
                    title: 'Społeczność graczy',
                    description: 'Łącz się z graczami, śledź twórców i odkrywaj treści.',
                },
            },
            pricing: {
                sectionTitle: 'Wybierz plan',
                sectionDescription: 'Każdy plan obejmuje bibliotekę gier i funkcje społecznościowe.',
            },
            reels: {
                sectionTitle: 'Popularne Reels',
                sectionDescription: 'Oglądaj najciekawsze momenty społeczności.',
            },
            blog: {
                sectionTitle: 'Aktualności i porady',
                sectionDescription: 'Bądź na bieżąco z wiadomościami ze świata gier.',
            },
            testimonials: {
                sectionTitle: 'Opinie graczy',
                sectionDescription: 'Tysiące graczy korzystają już ze Strike.',
            },
            cta: {
                title: 'Gotowy do gry?',
                description: 'Dołącz do Strike i doświadcz przyszłości cloud gamingu.',
                primaryCta: 'Zacznij za darmo',
                secondaryCta: 'Sprawdź ceny',
            },
        },
        footer: {
            about: 'O nas',
            careers: 'Kariera',
            blog: 'Blog',
            support: 'Pomoc',
            terms: 'Regulamin',
            privacy: 'Prywatność',
            cookies: 'Pliki cookie',
            copyright: '© 2024 Strike. Wszelkie prawa zastrzeżone.',
        },
        feed: {
            title: 'Kanał',
            description: 'Odkrywaj popularne klipy, reels i transmisje na żywo.',
            tabs: {
                forYou: 'Dla Ciebie',
                following: 'Obserwowani',
                explore: 'Eksploruj',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Witamy w wersji beta Strike. Pracujemy nad najlepszym doświadczeniem.',
            exploreGames: 'Poznaj gry',
        },
        games: {
            title: 'Gry',
            description: 'Przeglądaj bibliotekę 2000+ tytułów i graj natychmiast w chmurze.',
            searchPlaceholder: 'Szukaj gier...',
        },
        auth: {
            login: {
                title: 'Logowanie',
                description: 'Witaj ponownie w Strike',
                submit: 'Zaloguj się',
                forgotPassword: 'Zapomniałeś hasła?',
            },
            register: {
                title: 'Utwórz konto',
                description: 'Dołącz do Strike i zacznij grać',
                submit: 'Zarejestruj się',
            },
        },
        creator: {
            title: 'Profil twórcy',
        },
        landing: {
            hero: {
                title: 'Graj w {game} - Strike Gaming Cloud',
                description: 'Wejdź do gry w kilka sekund. Bez instalacji i łatek.',
            },
            cta: {
                startPlaying: 'Zacznij za darmo',
                browseGames: 'Przeglądaj gry',
                title: 'Chcesz zacząć?',
                description: 'Tysiące graczy bawi się już w chmurze Strike.',
                getStarted: 'Rozpocznij teraz',
            },
            features: {
                title: 'Dlaczego Strike?',
                noDownload: {
                    title: 'Bez pobierania',
                    description: 'Wszystko działa w chmurze, a urządzenie odbiera tylko obraz.',
                },
                instant: {
                    title: 'Natychmiastowy dostęp',
                    description: 'Uruchom grę w kilka sekund, bez instalacji.',
                },
                anywhere: {
                    title: 'Gra gdziekolwiek',
                    description: 'Korzystaj z PC, tabletu lub telefonu.',
                },
            },
            socialProof: {
                title: 'Co mówią gracze',
                testimonial1: 'Najlepsza platforma chmurowa bez opóźnień.',
                user1: 'Alex M.',
                testimonial2: 'Świetna jakość nawet na telefonie.',
                user2: 'Sarah K.',
                testimonial3: 'Powtórki i udostępnianie robią różnicę.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'Najczęstsze pytania',
                q1: 'Jak działa cloud gaming?',
                a1: 'Gra uruchomiona jest na serwerach i streamowana na urządzenie.',
                q2: 'Czy potrzebuję mocnego komputera?',
                a2: 'Nie, wystarczy stabilne łącze internetowe.',
                q3: 'Jakie gry są dostępne?',
                a3: 'Setki tytułów AAA i indie. Sprawdź katalog.',
            },
        },
    },
    ar: {
        common: {
            appName: 'سترايك',
            tagline: 'ألعاب سحابية. فورية. اجتماعية.',
            playNow: 'العب الآن',
            signUp: 'إنشاء حساب',
            signIn: 'تسجيل الدخول',
            learnMore: 'اعرف المزيد',
            getStarted: 'ابدأ الآن',
        },
        nav: {
            home: 'الرئيسية',
            feed: 'الخلاصة',
            games: 'الألعاب',
            live: 'مباشر',
            clips: 'مقاطع',
            community: 'المجتمع',
            pricing: 'الأسعار',
        },
        home: {
            hero: {
                title: 'العب أي لعبة، في أي مكان، فوراً.',
                subtitle: 'لا تحميل ولا انتظار. متعة لعب خالصة مدعومة بالسحابة.',
                cta: 'ابدأ مجاناً',
                learnMore: 'معلومات إضافية',
            },
            features: {
                sectionTitle: 'كل ما تحتاجه',
                sectionDescription: 'اكتشف المزايا التي تجعل Strike منصة الألعاب السحابية الأفضل.',
                viewAll: 'عرض جميع المزايا',
                cloudGaming: {
                    title: 'ألعاب سحابية',
                    description: 'العب أحدث ألعاب AAA فوراً عبر المتصفح أو الهاتف.',
                },
                reels: {
                    title: 'شارك لحظاتك',
                    description: 'أنشئ مقاطع مدهشة وشاركها بأسلوب Reels.',
                },
                social: {
                    title: 'مجتمع اللاعبين',
                    description: 'تواصل مع لاعبين، تابع المبدعين، واكتشف محتوى جديداً.',
                },
            },
            pricing: {
                sectionTitle: 'اختر خطتك',
                sectionDescription: 'جميع الخطط تمنحك مكتبة الألعاب والميزات الاجتماعية.',
            },
            reels: {
                sectionTitle: 'Reels رائجة',
                sectionDescription: 'شاهد أبرز لحظات مجتمعنا.',
            },
            blog: {
                sectionTitle: 'أخبار وتحديثات',
                sectionDescription: 'تابع آخر أخبار الألعاب والنصائح وقصص المجتمع.',
            },
            testimonials: {
                sectionTitle: 'آراء اللاعبين',
                sectionDescription: 'انضم إلى آلاف اللاعبين الذين يستخدمون Strike.',
            },
            cta: {
                title: 'جاهز لبدء اللعب؟',
                description: 'اختبر مستقبل الألعاب السحابية اليوم.',
                primaryCta: 'ابدأ مجاناً',
                secondaryCta: 'استعرض الأسعار',
            },
        },
        footer: {
            about: 'من نحن',
            careers: 'الوظائف',
            blog: 'المدونة',
            support: 'الدعم',
            terms: 'الشروط',
            privacy: 'الخصوصية',
            cookies: 'الكوكيز',
            copyright: '© 2024 سترايك. جميع الحقوق محفوظة.',
        },
        feed: {
            title: 'الخلاصة',
            description: 'اكتشف المقاطع والبثوث الأكثر شعبية.',
            tabs: {
                forYou: 'لك',
                following: 'تتابعهم',
                explore: 'استكشف',
            },
        },
        beta: {
            title: 'سترايك بيتا',
            description: 'مرحباً بك في النسخة التجريبية بينما نبني أفضل تجربة سحابية.',
            exploreGames: 'تصفح الألعاب',
        },
        games: {
            title: 'الألعاب',
            description: 'استعرض مكتبة تضم أكثر من 2000 لعبة والعب فوراً في السحابة.',
            searchPlaceholder: 'ابحث عن لعبة...',
        },
        auth: {
            login: {
                title: 'تسجيل الدخول',
                description: 'سعيدون بعودتك!',
                submit: 'دخول',
                forgotPassword: 'هل نسيت كلمة المرور؟',
            },
            register: {
                title: 'إنشاء حساب',
                description: 'انضم إلى Strike وابدأ اللعب',
                submit: 'تسجيل',
            },
        },
        creator: {
            title: 'ملف المنشئ',
        },
        landing: {
            hero: {
                title: 'العب {game} عبر Strike Gaming Cloud',
                description: 'ادخل اللعبة فوراً بدون تثبيت.',
            },
            cta: {
                startPlaying: 'ابدأ اللعب مجاناً',
                browseGames: 'تصفح الألعاب',
                title: 'لنبدأ اللعب',
                description: 'آلاف اللاعبين يستمتعون بالألعاب السحابية الآن.',
                getStarted: 'ابدأ الآن',
            },
            features: {
                title: 'لماذا Strike؟',
                noDownload: {
                    title: 'بدون تحميل',
                    description: 'كل العمليات تتم في السحابة، وجهازك يستقبل البث فقط.',
                },
                instant: {
                    title: 'وصول فوري',
                    description: 'ادخل إلى الألعاب في ثوانٍ معدودة.',
                },
                anywhere: {
                    title: 'العب في أي مكان',
                    description: 'من الحاسوب أو الهاتف أو الجهاز اللوحي.',
                },
            },
            socialProof: {
                title: 'شهادات اللاعبين',
                testimonial1: 'أفضل منصة سحابية جربتها، بلا تأخير.',
                user1: 'Alex M.',
                testimonial2: 'أحب اللعب على الهاتف بجودة رائعة.',
                user2: 'Sarah K.',
                testimonial3: 'ميزة الإعادة والمشاركة مذهلة!',
                user3: 'Mike T.',
            },
            faq: {
                title: 'الأسئلة الشائعة',
                q1: 'كيف يعمل اللعب السحابي؟',
                a1: 'اللعبة تعمل على خوادم قوية ويتم بثها إلى جهازك.',
                q2: 'هل أحتاج إلى جهاز قوي؟',
                a2: 'لا، فقط اتصال إنترنت مستقر.',
                q3: 'ما الألعاب المتاحة؟',
                a3: 'لدينا مجموعة كبيرة من ألعاب AAA وindie.',
            },
        },
    },
    id: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud gaming. Instan. Sosial.',
            playNow: 'Main sekarang',
            signUp: 'Daftar',
            signIn: 'Masuk',
            learnMore: 'Pelajari lebih lanjut',
            getStarted: 'Mulai',
        },
        nav: {
            home: 'Beranda',
            feed: 'Feed',
            games: 'Game',
            live: 'Live',
            clips: 'Klip',
            community: 'Komunitas',
            pricing: 'Harga',
        },
        home: {
            hero: {
                title: 'Mainkan game apa saja. Di mana saja. Seketika.',
                subtitle: 'Tanpa unduh dan tanpa antre. Hanya gaming murni berbasis cloud.',
                cta: 'Mulai gratis',
                learnMore: 'Pelajari lebih lanjut',
            },
            features: {
                sectionTitle: 'Semua yang kamu butuhkan',
                sectionDescription: 'Kenali fitur-fitur yang menjadikan Strike platform terbaik.',
                viewAll: 'Lihat semua fitur',
                cloudGaming: {
                    title: 'Cloud gaming',
                    description: 'Mainkan judul AAA terbaru lewat browser atau perangkat mobile.',
                },
                reels: {
                    title: 'Bagikan momen',
                    description: 'Buat dan bagikan klip epik dengan Reels ala TikTok.',
                },
                social: {
                    title: 'Komunitas gamer',
                    description: 'Terhubung dengan gamer lain, ikuti kreator, temukan konten.',
                },
            },
            pricing: {
                sectionTitle: 'Pilih paketmu',
                sectionDescription: 'Semua paket termasuk akses perpustakaan game dan fitur sosial.',
            },
            reels: {
                sectionTitle: 'Reels populer',
                sectionDescription: 'Tonton momen terbaik dari komunitas.',
            },
            blog: {
                sectionTitle: 'Berita & pembaruan',
                sectionDescription: 'Ikuti kabar terbaru, tips, dan sorotan komunitas.',
            },
            testimonials: {
                sectionTitle: 'Testimoni pemain',
                sectionDescription: 'Ribuan gamer sudah bermain di Strike.',
            },
            cta: {
                title: 'Siap bermain?',
                description: 'Gabung Strike hari ini dan rasakan masa depan cloud gaming.',
                primaryCta: 'Mulai gratis',
                secondaryCta: 'Lihat harga',
            },
        },
        footer: {
            about: 'Tentang',
            careers: 'Karier',
            blog: 'Blog',
            support: 'Dukungan',
            terms: 'Ketentuan',
            privacy: 'Privasi',
            cookies: 'Cookie',
            copyright: '© 2024 Strike. Hak cipta dilindungi.',
        },
        feed: {
            title: 'Feed',
            description: 'Jelajahi klip, reel, dan live streaming populer.',
            tabs: {
                forYou: 'Untukmu',
                following: 'Mengikuti',
                explore: 'Jelajah',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Selamat datang di versi beta. Kami terus menyempurnakan pengalaman terbaik.',
            exploreGames: 'Jelajah game',
        },
        games: {
            title: 'Game',
            description: 'Telusuri lebih dari 2000 game dan mainkan langsung di cloud.',
            searchPlaceholder: 'Cari game...',
        },
        auth: {
            login: {
                title: 'Masuk',
                description: 'Senang bertemu lagi!',
                submit: 'Masuk',
                forgotPassword: 'Lupa kata sandi?',
            },
            register: {
                title: 'Daftar akun',
                description: 'Bergabunglah dan mulai bermain sekarang',
                submit: 'Daftar',
            },
        },
        creator: {
            title: 'Profil kreator',
        },
        landing: {
            hero: {
                title: 'Mainkan {game} - Strike Gaming Cloud',
                description: 'Masuk ke permainan dalam hitungan detik tanpa instalasi.',
            },
            cta: {
                startPlaying: 'Mulai gratis',
                browseGames: 'Lihat game',
                title: 'Ayo mulai bermain',
                description: 'Ribuan gamer menikmati cloud gaming Strike.',
                getStarted: 'Mulai sekarang',
            },
            features: {
                title: 'Kenapa Strike?',
                noDownload: {
                    title: 'Tanpa unduhan',
                    description: 'Semua proses berjalan di cloud, perangkatmu hanya menayangkan.',
                },
                instant: {
                    title: 'Akses instan',
                    description: 'Masuk ke game tanpa menunggu instalasi panjang.',
                },
                anywhere: {
                    title: 'Main di mana saja',
                    description: 'Dukung PC, tablet, maupun smartphone.',
                },
            },
            socialProof: {
                title: 'Kata pemain',
                testimonial1: 'Platform cloud terbaik yang pernah saya coba.',
                user1: 'Alex M.',
                testimonial2: 'Kualitas grafis hebat bahkan di ponsel.',
                user2: 'Sarah K.',
                testimonial3: 'Fitur replay dan berbagi sangat berguna.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'FAQ',
                q1: 'Bagaimana cloud gaming bekerja?',
                a1: 'Game berjalan di server kuat dan ditampilkan ke perangkatmu.',
                q2: 'Butuh PC mahal?',
                a2: 'Tidak, cukup koneksi internet stabil.',
                q3: 'Game apa saja yang tersedia?',
                a3: 'Ada banyak judul AAA dan indie. Lihat katalog kami.',
            },
        },
    },
    vi: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud gaming. Tức thì. Kết nối.',
            playNow: 'Chơi ngay',
            signUp: 'Đăng ký',
            signIn: 'Đăng nhập',
            learnMore: 'Tìm hiểu thêm',
            getStarted: 'Bắt đầu',
        },
        nav: {
            home: 'Trang chủ',
            feed: 'Bảng tin',
            games: 'Trò chơi',
            live: 'Trực tiếp',
            clips: 'Clip',
            community: 'Cộng đồng',
            pricing: 'Gói cước',
        },
        home: {
            hero: {
                title: 'Chơi mọi game, mọi nơi, ngay lập tức.',
                subtitle: 'Không tải xuống, không chờ đợi. Chỉ còn niềm vui chơi game.',
                cta: 'Bắt đầu miễn phí',
                learnMore: 'Xem thêm',
            },
            features: {
                sectionTitle: 'Mọi tính năng bạn cần',
                sectionDescription: 'Khám phá các tính năng khiến Strike trở nên khác biệt.',
                viewAll: 'Xem tất cả tính năng',
                cloudGaming: {
                    title: 'Cloud gaming',
                    description: 'Chơi các game AAA mới nhất trên trình duyệt hoặc điện thoại.',
                },
                reels: {
                    title: 'Chia sẻ khoảnh khắc',
                    description: 'Tạo và chia sẻ clip theo phong cách Reels.',
                },
                social: {
                    title: 'Cộng đồng game thủ',
                    description: 'Kết nối với game thủ, theo dõi creator và khám phá nội dung.',
                },
            },
            pricing: {
                sectionTitle: 'Chọn gói của bạn',
                sectionDescription: 'Tất cả gói đều bao gồm thư viện game và tính năng xã hội.',
            },
            reels: {
                sectionTitle: 'Reels nổi bật',
                sectionDescription: 'Xem những khoảnh khắc hot nhất trong cộng đồng.',
            },
            blog: {
                sectionTitle: 'Tin tức & cập nhật',
                sectionDescription: 'Luôn cập nhật tin game, mẹo hay và câu chuyện cộng đồng.',
            },
            testimonials: {
                sectionTitle: 'Người dùng nói gì',
                sectionDescription: 'Hàng ngàn game thủ đã chọn Strike.',
            },
            cta: {
                title: 'Sẵn sàng chơi chứ?',
                description: 'Gia nhập Strike và cảm nhận tương lai cloud gaming.',
                primaryCta: 'Chơi miễn phí',
                secondaryCta: 'Xem gói',
            },
        },
        footer: {
            about: 'Về chúng tôi',
            careers: 'Tuyển dụng',
            blog: 'Blog',
            support: 'Hỗ trợ',
            terms: 'Điều khoản',
            privacy: 'Bảo mật',
            cookies: 'Cookie',
            copyright: '© 2024 Strike. Giữ mọi quyền.',
        },
        feed: {
            title: 'Bảng tin',
            description: 'Khám phá các clip, reels và livestream nổi bật.',
            tabs: {
                forYou: 'Cho bạn',
                following: 'Đang theo dõi',
                explore: 'Khám phá',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Chào mừng đến bản beta. Chúng tôi đang hoàn thiện trải nghiệm tuyệt nhất.',
            exploreGames: 'Khám phá game',
        },
        games: {
            title: 'Trò chơi',
            description: 'Duyệt thư viện hơn 2000 trò chơi và chơi ngay trên cloud.',
            searchPlaceholder: 'Tìm kiếm trò chơi...',
        },
        auth: {
            login: {
                title: 'Đăng nhập',
                description: 'Chào mừng quay lại!',
                submit: 'Đăng nhập',
                forgotPassword: 'Quên mật khẩu?',
            },
            register: {
                title: 'Tạo tài khoản',
                description: 'Tham gia Strike và bắt đầu chơi',
                submit: 'Đăng ký',
            },
        },
        creator: {
            title: 'Hồ sơ creator',
        },
        landing: {
            hero: {
                title: 'Chơi {game} - Strike Gaming Cloud',
                description: 'Bắt đầu trận đấu trong vài giây, không cần cài đặt.',
            },
            cta: {
                startPlaying: 'Chơi miễn phí',
                browseGames: 'Xem trò chơi',
                title: 'Bắt đầu ngay thôi',
                description: 'Hàng nghìn game thủ đang chơi trên Strike.',
                getStarted: 'Bắt đầu ngay',
            },
            features: {
                title: 'Vì sao chọn Strike?',
                noDownload: {
                    title: 'Không cần tải',
                    description: 'Mọi thứ chạy trên cloud, thiết bị chỉ nhận video.',
                },
                instant: {
                    title: 'Truy cập tức thì',
                    description: 'Vào game trong vài giây, không phải chờ update.',
                },
                anywhere: {
                    title: 'Chơi ở mọi nơi',
                    description: 'Hỗ trợ PC, tablet, điện thoại.',
                },
            },
            socialProof: {
                title: 'Đánh giá từ game thủ',
                testimonial1: 'Nền tảng cloud tốt nhất tôi từng dùng.',
                user1: 'Alex M.',
                testimonial2: 'Chơi trên điện thoại vẫn rất mượt.',
                user2: 'Sarah K.',
                testimonial3: 'Tính năng replay và chia sẻ cực tiện.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'Câu hỏi thường gặp',
                q1: 'Cloud gaming hoạt động thế nào?',
                a1: 'Game chạy trên server mạnh và truyền hình ảnh tới thiết bị.',
                q2: 'Cần máy tính mạnh không?',
                a2: 'Không, chỉ cần mạng ổn định.',
                q3: 'Có những game nào?',
                a3: 'Nhiều game AAA và indie. Xem danh mục của chúng tôi.',
            },
        },
    },
    tl: {
        common: {
            appName: 'Strike',
            tagline: 'Cloud gaming. Instant. Social.',
            playNow: 'Maglaro ngayon',
            signUp: 'Mag-sign up',
            signIn: 'Mag-login',
            learnMore: 'Alamin pa',
            getStarted: 'Simulan',
        },
        nav: {
            home: 'Home',
            feed: 'Feed',
            games: 'Mga laro',
            live: 'Live',
            clips: 'Clips',
            community: 'Komunidad',
            pricing: 'Presyo',
        },
        home: {
            hero: {
                title: 'Maglaro ng kahit anong game, saanman, agad-agad.',
                subtitle: 'Walang download at walang hintayan. Puro saya mula sa cloud.',
                cta: 'Libre magsimula',
                learnMore: 'Alamin pa',
            },
            features: {
                sectionTitle: 'Lahat ng kailangan mo',
                sectionDescription: 'Alamin kung bakit Strike ang ultimate cloud platform.',
                viewAll: 'Tingnan lahat',
                cloudGaming: {
                    title: 'Cloud gaming',
                    description: 'Agad na laruin ang mga AAA games sa browser o mobile.',
                },
                reels: {
                    title: 'Ibahagi ang moments',
                    description: 'Gumawa at mag-share ng epic clips gamit ang Reels.',
                },
                social: {
                    title: 'Gaming community',
                    description: 'Makipag-connect sa gamers at creators.',
                },
            },
            pricing: {
                sectionTitle: 'Piliin ang plan',
                sectionDescription: 'Bawat plan ay may access sa library at social features.',
            },
            reels: {
                sectionTitle: 'Usong Reels',
                sectionDescription: 'Panoorin ang mga paborito ng komunidad.',
            },
            blog: {
                sectionTitle: 'Balita at updates',
                sectionDescription: 'Manatiling updated sa gaming news at tips.',
            },
            testimonials: {
                sectionTitle: 'Sabi ng mga manlalaro',
                sectionDescription: 'Libo-libong gamers na ang nasa Strike.',
            },
            cta: {
                title: 'Handa nang maglaro?',
                description: 'Sumali sa Strike at damhin ang future ng gaming.',
                primaryCta: 'Libre magsimula',
                secondaryCta: 'Tingnan ang presyo',
            },
        },
        footer: {
            about: 'Tungkol sa amin',
            careers: 'Trabaho',
            blog: 'Blog',
            support: 'Suporta',
            terms: 'Terms',
            privacy: 'Privacy',
            cookies: 'Cookies',
            copyright: '© 2024 Strike. Lahat ng karapatan ay nakalaan.',
        },
        feed: {
            title: 'Feed',
            description: 'Tuklasin ang trending clips, reels, at live streams.',
            tabs: {
                forYou: 'Para sa’yo',
                following: 'Sinusundan',
                explore: 'Mag-explore',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Maligayang pagdating sa beta habang pinopino namin ang karanasan.',
            exploreGames: 'Tingnan ang mga laro',
        },
        games: {
            title: 'Mga laro',
            description: 'I-browse ang 2000+ na laro at maglaro agad sa cloud.',
            searchPlaceholder: 'Maghanap ng laro...',
        },
        auth: {
            login: {
                title: 'Mag-login',
                description: 'Welcome back sa Strike!',
                submit: 'Mag-login',
                forgotPassword: 'Nakalimutan ang password?',
            },
            register: {
                title: 'Gumawa ng account',
                description: 'Sumali at magsimulang maglaro',
                submit: 'Mag-sign up',
            },
        },
        creator: {
            title: 'Creator profile',
        },
        landing: {
            hero: {
                title: 'Laruin ang {game} - Strike Gaming Cloud',
                description: 'Simulan ang laro sa ilang segundo lang, walang install.',
            },
            cta: {
                startPlaying: 'Libre magsimula',
                browseGames: 'Tingnan ang mga laro',
                title: 'Tara, laro!',
                description: 'Libo-libong manlalaro ang naka-Strike na.',
                getStarted: 'Simulan ngayon',
            },
            features: {
                title: 'Bakit Strike?',
                noDownload: {
                    title: 'Walang download',
                    description: 'Lahat ginagawa sa cloud, stream lang sa device mo.',
                },
                instant: {
                    title: 'Instant access',
                    description: 'Magbukas ng laro sa ilang segundo.',
                },
                anywhere: {
                    title: 'Maglaro kahit saan',
                    description: 'Gamitin ang PC, tablet, o phone mo.',
                },
            },
            socialProof: {
                title: 'Mga testimonial',
                testimonial1: 'Pinakamagandang cloud platform na nasubukan ko.',
                user1: 'Alex M.',
                testimonial2: 'Sarap maglaro kahit nasa phone lang.',
                user2: 'Sarah K.',
                testimonial3: 'Astig ang replay at sharing features!',
                user3: 'Mike T.',
            },
            faq: {
                title: 'FAQs',
                q1: 'Paano gumagana ang cloud gaming?',
                a1: 'Sa server tumatakbo ang laro at sine-stream lang sa device mo.',
                q2: 'Kailangan ba ng malakas na PC?',
                a2: 'Hindi, stable na internet lang.',
                q3: 'Anong games ang meron?',
                a3: 'Maraming AAA at indie titles. Suriin ang catalog.',
            },
        },
    },
    ru: {
        common: {
            appName: 'Strike',
            tagline: 'Облачный гейминг. Мгновенно. Вместе.',
            playNow: 'Играть сейчас',
            signUp: 'Зарегистрироваться',
            signIn: 'Войти',
            learnMore: 'Узнать больше',
            getStarted: 'Начать',
        },
        nav: {
            home: 'Главная',
            feed: 'Лента',
            games: 'Игры',
            live: 'Стримы',
            clips: 'Клипы',
            community: 'Сообщество',
            pricing: 'Тарифы',
        },
        home: {
            hero: {
                title: 'Играй в любую игру. Где угодно. Мгновенно.',
                subtitle: 'Никаких загрузок и ожиданий — только потоковый гейминг.',
                cta: 'Попробовать бесплатно',
                learnMore: 'Подробнее',
            },
            features: {
                sectionTitle: 'Все необходимые функции',
                sectionDescription: 'Узнай, почему Strike — лучшая платформа облачного гейминга.',
                viewAll: 'Показать все',
                cloudGaming: {
                    title: 'Облачный гейминг',
                    description: 'Запускай AAA‑игры в браузере или на телефоне за секунды.',
                },
                reels: {
                    title: 'Делись моментами',
                    description: 'Создавай и делись клипами в формате Reels.',
                },
                social: {
                    title: 'Сообщество игроков',
                    description: 'Общайся с геймерами, подписывайся на авторов, открывай новое.',
                },
            },
            pricing: {
                sectionTitle: 'Выбери тариф',
                sectionDescription: 'Каждый тариф даёт доступ к библиотеке игр и соц-функциям.',
            },
            reels: {
                sectionTitle: 'Трендовые Reels',
                sectionDescription: 'Смотри лучшие моменты из комьюнити.',
            },
            blog: {
                sectionTitle: 'Новости и обновления',
                sectionDescription: 'Будь в курсе свежих новостей, советов и историй.',
            },
            testimonials: {
                sectionTitle: 'Отзывы игроков',
                sectionDescription: 'Тысячи геймеров уже выбрали Strike.',
            },
            cta: {
                title: 'Готов играть?',
                description: 'Присоединяйся к Strike и оцени будущее облачного гейминга.',
                primaryCta: 'Начать бесплатно',
                secondaryCta: 'Посмотреть тарифы',
            },
        },
        footer: {
            about: 'О компании',
            careers: 'Вакансии',
            blog: 'Блог',
            support: 'Поддержка',
            terms: 'Условия',
            privacy: 'Конфиденциальность',
            cookies: 'Cookies',
            copyright: '© 2024 Strike. Все права защищены.',
        },
        feed: {
            title: 'Лента',
            description: 'Смотри популярные клипы, Reels и прямые эфиры.',
            tabs: {
                forYou: 'Для тебя',
                following: 'Подписки',
                explore: 'Обзор',
            },
        },
        beta: {
            title: 'Strike Beta',
            description: 'Добро пожаловать в бета-версию — мы шлифуем лучший опыт.',
            exploreGames: 'Посмотреть игры',
        },
        games: {
            title: 'Игры',
            description: 'Ознакомься с библиотекой из 2000+ игр и играй сразу.',
            searchPlaceholder: 'Найти игру...',
        },
        auth: {
            login: {
                title: 'Войти',
                description: 'Рады снова видеть!',
                submit: 'Войти',
                forgotPassword: 'Забыли пароль?',
            },
            register: {
                title: 'Создать аккаунт',
                description: 'Присоединяйся и начинай играть',
                submit: 'Зарегистрироваться',
            },
        },
        creator: {
            title: 'Профиль автора',
        },
        landing: {
            hero: {
                title: 'Играй в {game} — Strike Gaming Cloud',
                description: 'Запускай игру без скачивания и установки.',
            },
            cta: {
                startPlaying: 'Играть бесплатно',
                browseGames: 'Каталог игр',
                title: 'Поехали?',
                description: 'Тысячи геймеров уже в облаке Strike.',
                getStarted: 'Стартовать',
            },
            features: {
                title: 'Почему Strike',
                noDownload: {
                    title: 'Без скачиваний',
                    description: 'Всё крутится на серверах, к тебе идёт только поток.',
                },
                instant: {
                    title: 'Мгновенный доступ',
                    description: 'Запускай игру за секунды, без долгих апдейтов.',
                },
                anywhere: {
                    title: 'Играй где угодно',
                    description: 'На ПК, планшете или смартфоне.',
                },
            },
            socialProof: {
                title: 'Отзывы',
                testimonial1: 'Лучшая облачная платформа, минимальная задержка.',
                user1: 'Alex M.',
                testimonial2: 'Люблю играть на телефоне в таком качестве.',
                user2: 'Sarah K.',
                testimonial3: 'Реплеи и шэринг — топ.',
                user3: 'Mike T.',
            },
            faq: {
                title: 'FAQ',
                q1: 'Как работает облачный гейминг?',
                a1: 'Игра выполняется на серверах и транслируется на твоё устройство.',
                q2: 'Нужен мощный компьютер?',
                a2: 'Нет, достаточно стабильного интернета.',
                q3: 'Какие игры доступны?',
                a3: 'Широкий выбор AAA и инди. Смотри каталог.',
            },
        },
    },
    zh: {
        common: {
            appName: 'Strike',
            tagline: '云游戏·即刻·社交',
            playNow: '立即畅玩',
            signUp: '注册',
            signIn: '登录',
            learnMore: '了解更多',
            getStarted: '开始体验',
        },
        nav: {
            home: '首页',
            feed: '动态',
            games: '游戏',
            live: '直播',
            clips: '剪辑',
            community: '社区',
            pricing: '价格',
        },
        home: {
            hero: {
                title: '随时随地，秒玩所有游戏。',
                subtitle: '无需下载，无需等待。云端驱动的纯粹游戏体验。',
                cta: '免费开始',
                learnMore: '了解详情',
            },
            features: {
                sectionTitle: '一切尽在掌握',
                sectionDescription: '探索 Strike 成为顶级云游戏平台的所有特性。',
                viewAll: '查看全部功能',
                cloudGaming: {
                    title: '云游戏',
                    description: '在浏览器或手机上即时畅玩 AAA 大作。',
                },
                reels: {
                    title: '分享高光',
                    description: '用 Reels 格式记录并分享你的精彩瞬间。',
                },
                social: {
                    title: '玩家社区',
                    description: '结识玩家、关注创作者、发现新内容。',
                },
            },
            pricing: {
                sectionTitle: '选择套餐',
                sectionDescription: '所有套餐均包含完整游戏库和社交功能。',
            },
            reels: {
                sectionTitle: '热门 Reels',
                sectionDescription: '欣赏社区最受欢迎的游戏瞬间。',
            },
            blog: {
                sectionTitle: '新闻与更新',
                sectionDescription: '随时掌握最新游戏资讯与技巧。',
            },
            testimonials: {
                sectionTitle: '玩家评价',
                sectionDescription: '数千玩家已在 Strike 畅玩。',
            },
            cta: {
                title: '准备好开玩了吗？',
                description: '立即加入 Strike，体验云游戏的未来。',
                primaryCta: '免费开始',
                secondaryCta: '查看价格',
            },
        },
        footer: {
            about: '关于我们',
            careers: '加入我们',
            blog: '博客',
            support: '支持',
            terms: '服务条款',
            privacy: '隐私政策',
            cookies: 'Cookie 政策',
            copyright: '© 2024 Strike. 保留所有权利。',
        },
        feed: {
            title: '动态',
            description: '发现热门游戏剪辑、Reels 与直播。',
            tabs: {
                forYou: '为你推荐',
                following: '关注',
                explore: '探索',
            },
        },
        beta: {
            title: 'Strike 测试版',
            description: '欢迎体验测试版，我们正在打造最佳云游戏体验。',
            exploreGames: '浏览游戏',
        },
        games: {
            title: '游戏',
            description: '浏览 2000+ 游戏库，立即云端畅玩。',
            searchPlaceholder: '搜索游戏...',
        },
        auth: {
            login: {
                title: '登录',
                description: '欢迎回到 Strike',
                submit: '登录',
                forgotPassword: '忘记密码？',
            },
            register: {
                title: '创建账户',
                description: '加入 Strike，立即开玩',
                submit: '注册',
            },
        },
        creator: {
            title: '创作者主页',
        },
        landing: {
            hero: {
                title: '畅玩 {game} - Strike 云游戏平台',
                description: '无需安装，秒进游戏。',
            },
            cta: {
                startPlaying: '免费畅玩',
                browseGames: '浏览更多游戏',
                title: '开玩吧',
                description: '成千上万的玩家正在 Strike 云端对战。',
                getStarted: '立即开始',
            },
            features: {
                title: '为什么选择 Strike？',
                noDownload: {
                    title: '无需下载',
                    description: '所有内容在云端运行，设备仅负责展示画面。',
                },
                instant: {
                    title: '瞬时启动',
                    description: '几秒钟即可进入游戏，无需等待更新。',
                },
                anywhere: {
                    title: '随处可玩',
                    description: '支持 PC、平板与手机多终端。',
                },
            },
            socialProof: {
                title: '玩家心声',
                testimonial1: '体验过的最佳云平台，几乎无延迟。',
                user1: 'Alex M.',
                testimonial2: '手机上也能保持极致画质。',
                user2: 'Sarah K.',
                testimonial3: '回放与分享功能非常强大。',
                user3: 'Mike T.',
            },
            faq: {
                title: '常见问题',
                q1: '云游戏是如何运行的？',
                a1: '游戏在服务器上运行，画面实时传输到你的设备。',
                q2: '需要高端电脑吗？',
                a2: '不需要，只要网络稳定即可。',
                q3: '有哪些游戏可玩？',
                a3: '拥有大量 AAA 与独立游戏，欢迎查看目录。',
            },
        },
    },
    ja: {
        common: {
            appName: 'Strike',
            tagline: 'クラウドゲーム。すぐに。みんなで。',
            playNow: '今すぐプレイ',
            signUp: '新規登録',
            signIn: 'ログイン',
            learnMore: '詳しく見る',
            getStarted: '始める',
        },
        nav: {
            home: 'ホーム',
            feed: 'フィード',
            games: 'ゲーム',
            live: 'ライブ',
            clips: 'クリップ',
            community: 'コミュニティ',
            pricing: '料金',
        },
        home: {
            hero: {
                title: 'いつでも、どこでも、すべてのゲームを即プレイ。',
                subtitle: 'ダウンロードも待ち時間も不要。クラウドが支えるピュアなゲーム体験。',
                cta: '無料でスタート',
                learnMore: 'さらに詳しく',
            },
            features: {
                sectionTitle: '必要な機能をすべて搭載',
                sectionDescription: 'Strike が究極のクラウドゲームプラットフォームである理由。',
                viewAll: '機能一覧',
                cloudGaming: {
                    title: 'クラウドゲーム',
                    description: '最新の AAA タイトルをブラウザやモバイルで即起動。',
                },
                reels: {
                    title: '瞬間を共有',
                    description: 'TikTok 風 Reels でハイライトを録画して共有。',
                },
                social: {
                    title: 'ゲーマーコミュニティ',
                    description: 'プレイヤーとつながり、クリエイターをフォローし、新作を発見。',
                },
            },
            pricing: {
                sectionTitle: 'プランを選択',
                sectionDescription: '全プランがゲームライブラリとソーシャル機能を含みます。',
            },
            reels: {
                sectionTitle: '人気の Reels',
                sectionDescription: 'コミュニティで話題のシーンをチェック。',
            },
            blog: {
                sectionTitle: 'ニュース & アップデート',
                sectionDescription: '最新のゲームニュースやコミュニティ情報をお届け。',
            },
            testimonials: {
                sectionTitle: 'ユーザーの声',
                sectionDescription: 'すでに数千人のゲーマーが Strike を利用しています。',
            },
            cta: {
                title: 'さあ、ゲームを始めましょう',
                description: '今すぐ Strike に参加してクラウドゲームの未来を体験。',
                primaryCta: '無料で始める',
                secondaryCta: '料金を見る',
            },
        },
        footer: {
            about: '会社情報',
            careers: '採用',
            blog: 'ブログ',
            support: 'サポート',
            terms: '利用規約',
            privacy: 'プライバシー',
            cookies: 'クッキー',
            copyright: '© 2024 Strike. All rights reserved.',
        },
        feed: {
            title: 'フィード',
            description: '人気のゲームクリップ、Reels、ライブ配信を発見。',
            tabs: {
                forYou: 'おすすめ',
                following: 'フォロー中',
                explore: '探す',
            },
        },
        beta: {
            title: 'Strike ベータ',
            description: 'ベータ版へようこそ。最高の体験を目指して改良中です。',
            exploreGames: 'ゲームを見る',
        },
        games: {
            title: 'ゲーム',
            description: '2000 本以上のゲームをブラウズし、雲の上で即プレイ。',
            searchPlaceholder: 'ゲーム検索...',
        },
        auth: {
            login: {
                title: 'ログイン',
                description: 'Strike へおかえりなさい',
                submit: 'ログイン',
                forgotPassword: 'パスワードを忘れた？',
            },
            register: {
                title: 'アカウント作成',
                description: 'Strike に参加してゲームを始めよう',
                submit: '登録する',
            },
        },
        creator: {
            title: 'クリエイタープロフィール',
        },
        landing: {
            hero: {
                title: '{game} をプレイ - Strike Gaming Cloud',
                description: 'インストール不要、すぐにゲームへ。',
            },
            cta: {
                startPlaying: '無料でプレイ',
                browseGames: 'ゲーム一覧',
                title: '今すぐプレイしよう',
                description: '多くのゲーマーが Strike のクラウドで遊んでいます。',
                getStarted: '始める',
            },
            features: {
                title: 'Strike を選ぶ理由',
                noDownload: {
                    title: 'ダウンロード不要',
                    description: '全てクラウドで処理され、端末には映像のみが届きます。',
                },
                instant: {
                    title: '即時アクセス',
                    description: 'インストールや更新を待たずに秒で起動。',
                },
                anywhere: {
                    title: 'どこでもプレイ',
                    description: 'PC・タブレット・スマホすべてに対応。',
                },
            },
            socialProof: {
                title: 'プレイヤーの声',
                testimonial1: '試した中で最高のクラウドプラットフォーム。遅延ゼロ！',
                user1: 'Alex M.',
                testimonial2: 'スマホでも驚くほど高画質。',
                user2: 'Sarah K.',
                testimonial3: 'リプレイと共有機能が素晴らしい。',
                user3: 'Mike T.',
            },
            faq: {
                title: 'よくある質問',
                q1: 'クラウドゲームはどう動くの？',
                a1: 'ゲームはサーバー上で実行され、映像が端末に配信されます。',
                q2: '高性能 PC が必要ですか？',
                a2: 'いいえ。安定したネット回線だけでOK。',
                q3: 'どんなゲームがありますか？',
                a3: 'AAA からインディーまで多彩なタイトルを用意しています。',
            },
        },
    },
};
function getMessages(locale) {
    return translations[locale] ?? translations.en;
}
