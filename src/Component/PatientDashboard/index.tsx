import { useEffect, useState } from "react";
import { apiService } from '../../apis/apiService';
import '../HospitalSystem/style.css'; // 기존 스타일 파일 사용
import {  Users } from "lucide-react";
import {ClncFlag} from "../../apis/types";
// 타입 정의
export interface UserInfo {
    userId: string;
    userName?: string;
    token: string;
    deptCode?: string;
    /** 관리자 계정이면 true */
    isAdmin: boolean;
}

interface PatientInfo {
    patId: string;
    patName: string;
    age: number;
    deptCode: string;
    prsnIdPre: string;
    clncCnfrmFlag: ClncFlag;
    juminNum: string;
    encryptedResidentNumber: string;
}

export interface WebViewerRequest {
    thirdPartyUserId: string;
    patientId: string;
    deptCode: string;
    residentNumber: string;
    thirdPartyInstitutionType: string;
    devMode: string;
}

interface PatientDashboardProps {
    user: UserInfo;
    onLogout: () => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, onLogout }) => {
    // 필터 관련 상태
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedClncFlag, setSelectedClncFlag] = useState<number>(0);
    // 환자 목록 관련 상태
    const [patients, setPatients] = useState<PatientInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 진료과 목록 로딩 상태 (컴포넌트 초기 로딩)
    const [initialLoading, setInitialLoading] = useState(true);
    const [initialError, setInitialError] = useState('');

    // 웹뷰어 열기 로직
    const handlePatientDoubleClick = async (patient: PatientInfo) => {
        try {
            const request: WebViewerRequest = {
                thirdPartyUserId: user.userId,
                patientId: patient.patId,
                deptCode: patient.deptCode,
                residentNumber: patient.juminNum,
                thirdPartyInstitutionType: "20",
                devMode: "0"
            };
            await apiService.openWebViewer(request);
        } catch (e) {
            alert('웹뷰어 열기에 실패했습니다.');
            console.error(e);
        }
    };

    // 컴포넌트 마운트 시 진료과 목록을 가져오는 useEffect
    useEffect(() => {
        apiService.getDepartments()
            .then(setDepartments)
            .catch(() => setInitialError('진료과 목록을 불러오는 데 실패했습니다.'))
            .finally(() => setInitialLoading(false));
    }, []);

    // 검색 버튼 클릭 시 환자 목록을 가져오는 함수
    const handleSearch = async () => {
        setLoading(true);
        setError('');
        try {
            const patientList = await apiService.getPatients(selectedClncFlag);
            setPatients(patientList);
        } catch (err) {
            setError('환자 목록 로딩에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 초기 로딩 중
    if (initialLoading) {
        return <div className="loading-container"><p>진료과 목록 로딩 중…</p></div>;
    }
    // 초기 로딩 에러
    if (initialError) {
        return <div className="error-message"><p>{initialError}</p></div>;
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
                            안녕하세요, {user.userName || user.userId}님
                        </span>
                        <button
                            onClick={onLogout}
                            className="logout-button"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {/* 필터 영역 */}
                <div className="filter-container">
                    <div className="filter-row">
                        <label>진료상태</label>
                        <select
                            value={selectedClncFlag}
                            onChange={e => setSelectedClncFlag(parseInt(e.target.value))}
                        >
                            <option value="0">미진료</option>
                            <option value="1">보류</option>
                            <option value="2">진료</option>
                        </select>
                    </div>
                    <div className="filter-row">
                        <button
                            disabled={loading} // 로딩 상태에만 의존
                            onClick={handleSearch}
                        >
                            <Users className="action-icon"/>
                            검색
                        </button>
                    </div>
                </div>

                {/* 환자 목록 헤더 */}
                <div className="patient-header">
                    <h2 className="patient-title">
                        {user.deptCode} 환자 목록
                    </h2>
                    <p className="patient-subtitle">테이블을 더블클릭하면 웹뷰어가 새 창에서 열립니다</p>
                </div>

                {/* 로딩 상태 */}
                {loading ? (
                        <div className="loading-container">
                            <div className="loading-content">
                                <div className="loading-spinner"></div>
                                <p className="loading-text">환자 목록을 불러오는 중...</p>
                            </div>
                        </div>
                    ) : // 에러 상태
                    error ? (
                            <div className="error-message">
                                <p>{error}</p>
                            </div>
                        ) : // 빈 목록 상태
                        patients.length === 0 ? (
                            <div className="empty-state">
                                <Users className="empty-icon" />
                                <h3 className="empty-title">환자가 없습니다</h3>
                                <p className="empty-text">이 진료과에 등록된 환자가 없습니다.</p>
                            </div>
                        ) : (
                            // 정상 목록 상태
                            <div className="table-container">
                                    <table className="patient-table">
                                        <thead className="table-header">
                                        <tr>
                                            <th>환자ID</th>
                                            <th>이름</th>
                                            <th>나이</th>
                                            <th>생년월일</th>
                                            <th>진료상태</th>
                                        </tr>
                                        </thead>
                                        <tbody className="table-body">
                                        {patients.map((patient) => (
                                            <tr
                                                key={patient.patId}
                                                onDoubleClick={() => handlePatientDoubleClick(patient)}
                                                className="table-row"
                                            >
                                                <td className="table-cell">
                                                    <span className="patient-id">{patient.patId}</span>
                                                </td>
                                                <td className="table-cell">
                                                    <span className="patient-name">{patient.patName}</span>
                                                </td>
                                                <td className="table-cell">
                                                    <span className="patient-age">{patient.age}세</span>
                                                </td>
                                                <td className="table-cell">
                                                    <span className="patient-resident">{patient.prsnIdPre}</span>
                                                </td>
                                                <td className="table-cell">
                                                    <span className="patient-status">
                                                        {patient.clncCnfrmFlag === 2 ? '진료'
                                                            : patient.clncCnfrmFlag === 1 ? '보류'
                                                                : '미진료'}
                                                    </span>
                                                </td>

                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                            </div>
                        )}
            </main>
        </div>
    );
};

export default PatientDashboard;