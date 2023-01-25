export interface BaseTTProps {
    cookiesPath: string;
    proxy?: {
        host: string;
        login?: string;
        password?: string;
    };
    autoResponder?: {
        enabled: boolean;
        messages: string[];
    };
    autoFollower?: {
        enabled: boolean;
        followersPath: string;
    };
}
