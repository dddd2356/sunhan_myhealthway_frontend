import {ClncFlag} from "../../apis/types";

export interface UserInfo {
    userId: string;
    userName?: string;
    token: string;   // 서버에서 전달되는 JWT
    deptCode?: string;
    /** 관리자 계정이면 true */
    isAdmin: boolean;
}

// 관리자 관련 인터페이스 - seedKey 추가
export interface AdminSettings {
    thirdPartyAuthUrl: string;
    clientId: string;
    clientSecret: string;
    utilizationServiceNo: string;
    institutionCode: string;
    seedKey: string;
}


export interface PatientInfo {
    patId: string;
    patName: string;
    age: number;
    deptCode: string;
    prsnIdPre: string;
    clncCnfrmFlag: ClncFlag;
    juminNum: string;
    encryptedResidentNumber: string;
}

// DTO와 필드명 통일
export interface WebViewerRequest {
    thirdPartyUserId: string;
    patientId: string;
    deptCode: string;
    residentNumber: string;
    thirdPartyInstitutionType: string;
    devMode: string;
}

// 백엔드 응답 구조와 일치하는 인터페이스 추가
interface LoginResponseDto {
    // 일반 사용자용 필드
    token?: string;
    user?: {
        userId: string;
        userName?: string;
        deptCode?: string;
    };

    // 관리자용 필드
    requirePassword?: boolean;
    isAdmin?: boolean;
    userId?: string;  // 관리자 응답에서 사용

    // 관리자 인증 완료용 필드
    success?: boolean;
    message?: string;
}

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function getAuthHeaders() {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

export const apiService = {
    login: async (userId: string): Promise<UserInfo | { requirePassword: boolean; isAdmin: boolean; userId: string }> => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error('로그인에 실패했습니다');
        }

        const result: LoginResponseDto = await response.json();

        // 관리자 계정의 경우 비밀번호 입력 필요
        if (result.requirePassword) {
            return {
                requirePassword: true,
                isAdmin: result.isAdmin || false,
                userId: result.userId || userId
            };
        }

        // 일반 사용자 로그인
        if (result.token && result.user) {
            const userInfo: UserInfo = {
                userId: result.user.userId,
                userName: result.user.userName,
                token: result.token,
                deptCode: result.user.deptCode,
                isAdmin: false
            };

            // 세션스토리지에 저장
            sessionStorage.setItem('token', userInfo.token);
            sessionStorage.setItem('userId', userInfo.userId);
            if (userInfo.userName) {
                sessionStorage.setItem('userName', userInfo.userName);
            }
            if (userInfo.deptCode) {
                sessionStorage.setItem('deptCode', userInfo.deptCode);
            }
            sessionStorage.setItem('isAdmin', 'false');
            return userInfo;
        }

        throw new Error('예상하지 못한 응답 형식입니다');
    },

    // 관리자 로그인
    adminLogin: async (userId: string, password: string): Promise<UserInfo> => {
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password }),
        });

        if (!response.ok) {
            throw new Error('관리자 로그인에 실패했습니다');
        }

        const result: LoginResponseDto = await response.json();

        // 백엔드에서 실제 토큰을 반환한다면
        const userInfo: UserInfo = {
            userId: result.userId || userId,
            userName: result.user?.userName || '관리자',
            token: result.token || 'admin-token', // 백엔드에서 실제 토큰 반환 시 사용
            deptCode: result.user?.deptCode || 'ADMIN',
            isAdmin: true
        };

        // 세션스토리지에 저장
        sessionStorage.setItem('token', userInfo.token);
        sessionStorage.setItem('userId', userInfo.userId);
        sessionStorage.setItem('userName', userInfo.userName || '관리자');
        sessionStorage.setItem('deptCode', userInfo.deptCode || 'ADMIN');
        sessionStorage.setItem('isAdmin', 'true');

        return userInfo;
    },

    // 관리자 설정 조회
    getAdminSettings: async (): Promise<AdminSettings> => {
        const response = await fetch(`${API_BASE}/admin/settings`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('관리자 설정을 가져오는데 실패했습니다');
        }
        return response.json();
    },

    // 범용 설정 업데이트 함수
    updateSetting: async (endpoint: string, data: any): Promise<void> => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[apiService] ${endpoint} failed:`, errorText);
            throw new Error(errorText || '설정 업데이트에 실패했습니다');
        }
    },

    // URL 업데이트 (기존 호환성 유지)
    updateUrl: async (url: string): Promise<void> => {
        return apiService.updateSetting('/admin/settings/url', { url });
    },

    // Client ID 업데이트
    updateClientId: async (clientId: string): Promise<void> => {
        return apiService.updateSetting('/admin/settings/client-id', { clientId });
    },

    // Client Secret 업데이트
    updateClientSecret: async (clientSecret: string): Promise<void> => {
        return apiService.updateSetting('/admin/settings/client-secret', { clientSecret });
    },

    // Utilization Service No 업데이트
    updateUtilizationServiceNo: async (utilizationServiceNo: string): Promise<void> => {
        return apiService.updateSetting('/admin/settings/utilization-service-no', { utilizationServiceNo });
    },

    // Institution Code 업데이트
    updateInstitutionCode: async (institutionCode: string): Promise<void> => {
        return apiService.updateSetting('/admin/settings/institution-code', { institutionCode });
    },

    // Seed Key 업데이트
    updateSeedKey: async (seedKey: string): Promise<void> => {
        return apiService.updateSetting('/admin/settings/seed-key', { seedKey });
    },

    // 테스트 환자 요청
    testPatient: async (residentNumber: string, userId: string): Promise<any> => {
        const response = await fetch(`${API_BASE}/admin/test-patient`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ residentNumber, userId }),
        });
        if (!response.ok) {
            throw new Error('테스트 요청에 실패했습니다');
        }
        return response.json();
    },

    validateToken: async () => {
        const response = await fetch(`${API_BASE}/auth/validate`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('토큰 검증에 실패했습니다');
        }
        return response.json();
    },

    getDepartments: async (): Promise<string[]> => {
        const response = await fetch(`${API_BASE}/auth/departments`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('진료과 목록을 가져오는데 실패했습니다');
        }
        return response.json();
    },

    /**
     * 현재 로그인한 사용자의 진료 상태(clncCnfrmFlag)별 환자 목록을 조회합니다.
     * @param clncCnfrmFlag - 진료 상태 ('0':미진료, '1':보류, '2':진료)
     */
    getPatients: async (clncCnfrmFlag: number): Promise<PatientInfo[]> => {
        const response = await fetch(
            `${API_BASE}/patients?clncCnfrmFlag=${clncCnfrmFlag}`,
            { headers: getAuthHeaders() }
        );
        if (!response.ok) {
            throw new Error('환자 목록을 가져오는데 실패했습니다');
        }
        return response.json();
    },

    openWebViewer: async (request: WebViewerRequest): Promise<void> => {
        const newWindow = window.open('', '_blank', 'width=1280,height=800,scrollbars=yes,resizable=yes');
        if (!newWindow) {
            alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
            return;
        }

        try {
            const headers = getAuthHeaders();
            console.log('API Request Headers:', headers); // <<-- 이 줄을 추가

            const response = await fetch(`${API_BASE}/webviewer/open`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                // 응답 본문을 먼저 텍스트로 읽습니다.
                const errorText = await response.text();
                let errorMessage = '웹뷰어 열기에 실패했습니다.';

                try {
                    // 텍스트가 JSON 형식인지 시도합니다.
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // JSON 파싱 실패 시, 서버에서 비정형 응답을 보냈으므로 원시 텍스트를 사용
                    errorMessage = `서버 오류: ${errorText}`;
                }

                if (newWindow && !newWindow.closed) newWindow.close();
                alert(errorMessage);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            const finalUrl = result.webViewerUrl;

            // 새 창에서 URL로 바로 이동
            newWindow.location.href = finalUrl;

        } catch (error) {
            if (newWindow && !newWindow.closed) newWindow.close();
            console.error('WebViewer Open Failed:', error);
            throw error;
        }
    },
};