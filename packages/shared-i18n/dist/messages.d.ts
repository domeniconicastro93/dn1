import type { SupportedLocale } from './locales';
type CTAContent = {
    title: string;
    description: string;
    primaryCta?: string;
    secondaryCta?: string;
    startPlaying?: string;
    browseGames?: string;
    getStarted?: string;
};
type HeroContent = {
    title: string;
    subtitle: string;
    cta: string;
    learnMore: string;
};
type FeatureCard = {
    title: string;
    description: string;
};
type HomeSection = {
    hero: HeroContent;
    features: {
        sectionTitle: string;
        sectionDescription: string;
        viewAll: string;
        cloudGaming: FeatureCard;
        reels: FeatureCard;
        social: FeatureCard;
    };
    pricing: {
        sectionTitle: string;
        sectionDescription: string;
    };
    reels: {
        sectionTitle: string;
        sectionDescription: string;
    };
    blog: {
        sectionTitle: string;
        sectionDescription: string;
    };
    testimonials: {
        sectionTitle: string;
        sectionDescription: string;
    };
    cta: CTAContent;
};
type LandingSection = {
    hero: {
        title: string;
        description: string;
    };
    cta: CTAContent & {
        startPlaying: string;
        browseGames: string;
    };
    features: {
        title: string;
        noDownload: FeatureCard;
        instant: FeatureCard;
        anywhere: FeatureCard;
    };
    socialProof: {
        title: string;
        testimonial1: string;
        user1: string;
        testimonial2: string;
        user2: string;
        testimonial3: string;
        user3: string;
    };
    faq: {
        title: string;
        q1: string;
        a1: string;
        q2: string;
        a2: string;
        q3: string;
        a3: string;
    };
};
export type Messages = {
    common: {
        appName: string;
        tagline: string;
        playNow: string;
        signUp: string;
        signIn: string;
        learnMore: string;
        getStarted: string;
    };
    nav: {
        home: string;
        feed: string;
        games: string;
        live: string;
        clips: string;
        community: string;
        pricing: string;
    };
    home: HomeSection;
    footer: {
        about: string;
        careers: string;
        blog: string;
        support: string;
        terms: string;
        privacy: string;
        cookies: string;
        copyright: string;
    };
    feed: {
        title: string;
        description: string;
        tabs: {
            forYou: string;
            following: string;
            explore: string;
        };
    };
    beta: {
        title: string;
        description: string;
        exploreGames: string;
    };
    games: {
        title: string;
        description: string;
        searchPlaceholder: string;
    };
    auth: {
        login: {
            title: string;
            description: string;
            submit: string;
            forgotPassword: string;
        };
        register: {
            title: string;
            description: string;
            submit: string;
        };
    };
    creator: {
        title: string;
    };
    landing: LandingSection;
};
export declare function getMessages(locale: SupportedLocale): Messages;
export {};
