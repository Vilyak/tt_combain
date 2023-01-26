export interface BaseTTProps {
    id: number;
    enabled: boolean;
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
