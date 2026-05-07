import axios, { AxiosInstance } from 'axios';

export interface SiYuanResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

export function resolveSiyuanToken(env: Record<string, string | undefined> = process.env): string {
    return env.SIYUAN_TOKEN ||
        env.SIYUAN_API_TOKEN ||
        env.SIYUAN_AUTH_TOKEN ||
        '';
}

export function normalizeSiyuanApiUrl(rawUrl: string | undefined): string {
    const fallback = 'http://localhost:6806';
    const value = rawUrl?.trim();

    if (!value) {
        return fallback;
    }

    if (!/^https?:\/\//i.test(value)) {
        return `http://${value}`;
    }

    return value;
}

// 创建标准 handler 的工厂函数
export function createHandler(endpoint: string): (params: unknown) => Promise<any> {
    return async (params: unknown) => {
        const response = await client.post(endpoint, params);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response.data)
                }
            ]
        };
    };
}

class SiYuanClient {
    private static instance: SiYuanClient | null = null;
    private axiosInstance: AxiosInstance;

    private constructor() {
        // 动态获取环境变量
        const baseURL = this.getBaseURL();
        const token = this.getToken();

        if (!token) {
            console.warn('⚠️  警告：未设置 SIYUAN_TOKEN 环境变量，API 调用可能会失败');
            console.warn('💡 请设置以下环境变量之一：SIYUAN_TOKEN、SIYUAN_API_TOKEN、SIYUAN_AUTH_TOKEN');
        } else if (process.env.NODE_ENV !== 'test') {
            // MCP 使用 stdio 传输时，stdout 只能输出 JSON-RPC 消息。
            console.error('🔗 已连接到思源笔记 API:', baseURL);
        }

        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 添加请求拦截器，动态更新 token
        this.axiosInstance.interceptors.request.use(
            config => {
                const currentToken = this.getToken();
                if (currentToken) {
                    config.headers['Authorization'] = `Token ${currentToken}`;
                }
                return config;
            },
            error => Promise.reject(error)
        );

        // 添加响应拦截器
        this.axiosInstance.interceptors.response.use(
            response => response.data,
            error => {
                // 增强错误处理
                if (error.response) {
                    console.error('😱 API 响应错误:', {
                        status: error.response.status,
                        data: error.response.data,
                        url: error.config?.url
                    });

                    // 如果是认证错误，提供更友好的错误信息
                    if (error.response.status === 401) {
                        console.error('🔒 认证失败：请检查 SIYUAN_TOKEN 是否正确');
                    }
                } else if (error.request) {
                    console.error('🌐 API 请求错误:', error.message);
                    console.error('🔍 请检查：1) 思源笔记是否正在运行 2) API 服务是否开启 3) 网络连接是否正常');
                } else {
                    console.error('❌ 其他错误:', error.message);
                }
                return Promise.reject(error);
            }
        );
    }

    private getBaseURL(): string {
        return normalizeSiyuanApiUrl(process.env.SIYUAN_API_URL);
    }

    private getToken(): string {
        return resolveSiyuanToken(process.env);
    }

    public static getInstance(): SiYuanClient {
        if (!SiYuanClient.instance) {
            SiYuanClient.instance = new SiYuanClient();
        }
        return SiYuanClient.instance;
    }

    // 基础 HTTP 方法
    async post<T = any>(url: string, data?: any): Promise<SiYuanResponse<T>> {
        return this.axiosInstance.post(url, data);
    }

    /**
     * Upload file via multipart/form-data
     * SiYuan's /api/file/putFile requires multipart/form-data, not JSON
     */
    async putFile(path: string, content: string, isDir = false): Promise<SiYuanResponse<any>> {
        const formData = new FormData();
        formData.append('path', path);
        formData.append('isDir', String(isDir));
        if (!isDir) {
            formData.append('file', new Blob([content]), path.split('/').pop() || 'file');
        }
        return this.axiosInstance.post('/api/file/putFile', formData, {
            headers: {
                'Content-Type': undefined as any
            }
        });
    }
}

export const client = SiYuanClient.getInstance();