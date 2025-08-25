import React, { useState, useEffect } from 'react';
import {apiService, AdminSettings, WebViewerRequest} from '../../apis/apiService';
import {Settings, Save, User, TestTubeDiagonal} from 'lucide-react';

interface UserInfo {
    userId: string;
    userName?: string;
    token: string;
    deptCode?: string;
    /** 관리자 계정이면 true */
    isAdmin: boolean;
}

interface AdminDashboardProps {
    user: UserInfo;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({
        thirdPartyAuthUrl: '',
        clientId: '',
        clientSecret: '',
        utilizationServiceNo: '',
        institutionCode: '',
        seedKey: ''
    });
    const [newUrl, setNewUrl] = useState('');
    const [testResidentNumber, setTestResidentNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState<{[key: string]: boolean}>({});
    const [testLoading, setTestLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await apiService.getAdminSettings();
            setSettings(data);
            // 입력 필드는 초기화하여 빈 상태로 유지
            setFormData({
                thirdPartyAuthUrl: '',
                clientId: '',
                clientSecret: '',
                utilizationServiceNo: '',
                institutionCode: '',
                seedKey: ''
            });
        } catch (err) {
            setError('설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // requestField를 추가로 받아서 올바른 키로 전송
    const handleUpdateField = async (
        fieldKey: string,
        requestField: string,
        apiEndpoint: string,
        fieldName: string,
        successMessage: string
    ) => {
        const value = formData[fieldKey] || '';
        if (!value.trim()) {
            setError(`${fieldName}을(를) 입력해주세요.`);
            return;
        }

        setUpdateLoading(prev => ({ ...prev, [fieldKey]: true }));
        setError('');
        setMessage('');
        console.log(`[Admin] POST ${apiEndpoint}`, { [requestField]: value });
        try {
            // API 호출 시 올바른 필드 이름으로 전송
            await apiService.updateSetting(apiEndpoint, { [requestField]: value });
            setMessage(successMessage);
            await loadSettings();
        } catch (err) {
            setError(err instanceof Error ? err.message : `${fieldName} 업데이트에 실패했습니다.`);
        } finally {
            setUpdateLoading(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const handleTestPatient = async () => {
        if (!testResidentNumber.trim()) {
            setError('주민번호를 입력해주세요.');
            return;
        }
        // 주민번호 형식 검증 (13자리 숫자)
        if (!/^\d{13}$/.test(testResidentNumber.trim())) {
            setError('주민번호는 13자리 숫자로 입력해주세요 (예: 9501011111111)');
            return;
        }

        console.log('입력한 주민번호:', testResidentNumber);
        console.log('주민번호 길이:', testResidentNumber.length);
        setTestLoading(true);
        setError('');
        setMessage('');

        try {
            // openWebViewer에 필요한 request 객체 생성
            const request: WebViewerRequest = {
                thirdPartyUserId: user.userId,
                patientId: 'TEST_PATIENT', // 테스트 환자 ID 임시 지정
                deptCode: user.deptCode || 'TEST_DEPT', // deptCode가 없을 경우를 대비
                residentNumber: testResidentNumber,
                thirdPartyInstitutionType: "20",
                devMode: "0"
            };

            // openWebViewer 함수를 직접 호출하여 새 창을 띄움
            await apiService.openWebViewer(request);

            setMessage('웹뷰어 테스트 요청이 성공적으로 처리되었습니다.');
        } catch (err) {
            setError(err instanceof Error ? err.message : '테스트 요청에 실패했습니다.');
        } finally {
            setTestLoading(false);
        }
    };

    const settingFields = [
        {
            key: 'thirdPartyAuthUrl',
            label: 'API URL',
            placeholder: '',
            endpoint: '/admin/settings/url',
            requestField: 'url',
            successMessage: 'URL이 성공적으로 업데이트되었습니다.'
        },
        {
            key: 'clientId',
            label: 'Client ID',
            placeholder: '',
            endpoint: '/admin/settings/client-id',
            requestField: 'clientId',
            successMessage: 'Client ID가 성공적으로 업데이트되었습니다.'
        },
        {
            key: 'clientSecret',
            label: 'Client Secret',
            placeholder: '',
            endpoint: '/admin/settings/client-secret',
            requestField: 'clientSecret',
            successMessage: 'Client Secret이 성공적으로 업데이트되었습니다.',
        },
        {
            key: 'utilizationServiceNo',
            label: 'Utilization Service No',
            placeholder: '',
            endpoint: '/admin/settings/utilization-service-no',
            requestField: 'utilizationServiceNo',
            successMessage: 'Utilization Service No가 성공적으로 업데이트되었습니다.'
        },
        {
            key: 'institutionCode',
            label: 'Institution Code',
            placeholder: '',
            endpoint: '/admin/settings/institution-code',
            requestField: 'institutionCode',
            successMessage: 'Institution Code가 성공적으로 업데이트되었습니다.'
        },
        {
            key: 'seedKey',
            label: 'Seed Key',
            placeholder: '',
            endpoint: '/admin/settings/seed-key',
            requestField: 'seedKey',
            successMessage: 'Seed Key가 성공적으로 업데이트되었습니다.',
        }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">설정을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <header className="app-header">
                <div className="header-content">
                    <div className="header-left">
                        <img src="/newExecution.ico" alt="병원 아이콘" style={{ width: '40px', height: '40px' }}/>
                        <h1 className="header-title">선한병원 건강정보고속도로</h1>
                    </div>
                    <div className="header-right">
                        <span className="user-greeting">
                            관리자님 환영합니다
                        </span>
                        <button onClick={onLogout} className="logout-button">
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content admin-content">
                {/* 시스템 설정 섹션 */}
                <div className="admin-section">
                    <div className="admin-section-header">
                        <Settings className="section-icon" />
                        <h2>시스템 설정</h2>
                    </div>
                    <div className="admin-section-content">
                        {settingFields.map((field) => (
                            <div key={field.key} className="setting-group">
                                <div className="form-group">
                                    <label className="form-label">{field.label}</label>
                                    {settings && (
                                        <div className="current-value">
                                            현재값: {settings[field.key as keyof AdminSettings] || '설정되지 않음'}
                                        </div>
                                    )}
                                    <div className="setting-input-group">
                                        <input
                                            type={"text"}
                                            value={formData[field.key as keyof typeof formData]}
                                            onChange={e => handleInputChange(field.key, e.target.value)}
                                            className="form-input"
                                            placeholder={field.placeholder}
                                            disabled={updateLoading[field.key]}
                                        />
                                        <button
                                            onClick={() => handleUpdateField(
                                                field.key,
                                                (field as any).requestField,
                                                field.endpoint,
                                                field.label,
                                                field.successMessage
                                            )}
                                            disabled={updateLoading[field.key] || !formData[field.key as keyof typeof formData].trim()}
                                            className="setting-update-button"
                                        >
                                            <Save className="w-4 h-4" />
                                            {updateLoading[field.key] ? '업데이트 중...' : '업데이트'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 테스트 환자 섹션 */}
                <div className="admin-section">
                    <div className="admin-section-header">
                        <TestTubeDiagonal className="section-icon" />
                        <h2>테스트 환자</h2>
                    </div>
                    <div className="admin-section-content">
                        <div className="form-group">
                            <label className="form-label">주민등록번호</label>
                            <div className="test-input-group">
                                <input
                                    type="text"
                                    value={testResidentNumber}
                                    onChange={(e) => setTestResidentNumber(e.target.value)}
                                    className="form-input"
                                    placeholder="주민등록번호를 입력하세요 (예: 9501011111111)"
                                    disabled={testLoading}
                                />
                                <button
                                    onClick={handleTestPatient}
                                    disabled={testLoading || !testResidentNumber.trim()}
                                    className="test-button"
                                >
                                    <User className="w-4 h-4" />
                                    {testLoading ? '테스트 중...' : '테스트 실행'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 메시지 표시 */}
                {message && (
                    <div className="success-message">
                        <p>{message}</p>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;