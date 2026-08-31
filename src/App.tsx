import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  ChangeEvent,
} from "react";
import "./styles.css";

// ==========================================
// 1. 데이터 타입 정의
// ==========================================
export interface GradeRecord {
  id: string;
  grade: 1 | 2 | 3;
  semester: 1 | 2;
  tableType: "regular" | "career" | "arts_pe" | "other";
  subjectGroup: string;
  subject: string;
  credits: number | null;
  rawScore: number | null;
  average: number | null;
  stdDev: number | null;
  studentCount: number | null;
  achievement: string | null;
  achievementRatio: string | null;
  rankGrade: number | null;
}

export interface AnalysisSettings {
  subjectCombination:
    | "전교과"
    | "국영수"
    | "국영수한"
    | "국영수사과"
    | "국영수사과한"
    | "국영수사"
    | "국영수사한"
    | "국영수과"
    | "국영"
    | "국영사"
    | "국영사한";
  useCredits: boolean;
  weightType: "100" | "custom";
  customWeights: { g1: number; g2: number; g3: number };
}

export interface AnalysisResult {
  overallAverage: number | null;
  grade1Average: number | null;
  grade2Average: number | null;
  grade3Average: number | null;
  validSubjectCount: number;
  validCreditsCount: number;
  excludedSubjectCount: number;
}

export interface CutoffData {
  /** 두 번째 컷의 실제 원자료 백분위. 기존 필드명 finalPass75CutGrade는 하위호환을 위해 유지합니다. */
  secondCutPercent?: 70 | 75;
  firstPass50CutScore?: number;
  firstPass75CutScore?: number;
  firstPassAvgGrade?: number;
  finalPass50CutScore?: number;
  finalPass75CutScore?: number;
  finalPassAvgGrade?: number;
  finalPass50CutGrade?: number;
  finalPass75CutGrade?: number;
}

export interface AdmissionType {
  id: string;
  name: string;
  category: "교과" | "종합";
  cutoffs?: CutoffData;
}

export interface Department {
  id: string;
  name: string;
  college: string;
  admissions: AdmissionType[];
}

export interface UniversityData {
  id: string;
  name: string;
  campus: string;
  departments: Department[];
}

// ==========================================
// 2. 전형 및 학과 데이터
// ==========================================
const ALL_DEPARTMENTS: Department[] = [
  // 인문대학
  {
    id: "kor",
    name: "국어국문학과",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.96, finalPass75CutGrade: 4.09 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.5, finalPass75CutGrade: 4.55 },
      },
    ],
  },
  {
    id: "eng",
    name: "영어영문학과",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.19, finalPass75CutGrade: 4.22 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.32, finalPass75CutGrade: 6.05 },
      },
    ],
  },
  {
    id: "chi",
    name: "중어중문학과",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.73, finalPass75CutGrade: 4.8 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 6.01, finalPass75CutGrade: 6.12 },
      },
    ],
  },
  {
    id: "jpn",
    name: "일본학과",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.8, finalPass75CutGrade: 3.96 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.02, finalPass75CutGrade: 5.06 },
      },
    ],
  },
  {
    id: "phil",
    name: "철학과",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.0, finalPass75CutGrade: 4.19 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.16, finalPass75CutGrade: 5.33 },
      },
    ],
  },
  {
    id: "his",
    name: "사학과",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.85, finalPass75CutGrade: 3.9 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.18, finalPass75CutGrade: 4.66 },
      },
    ],
  },
  {
    id: "inmun-free",
    name: "인문대학자유전공학과",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.49, finalPass75CutGrade: 4.72 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.16, finalPass75CutGrade: 5.55 },
      },
    ],
  },
  {
    id: "inmun-free-2",
    name: "자유전공학부(인문)",
    college: "인문대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.1, finalPass75CutGrade: 4.43 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.97, finalPass75CutGrade: 5.28 },
      },
    ],
  },
  // 사회과학대학
  {
    id: "biz",
    name: "경영학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.49, finalPass75CutGrade: 3.6 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.45, finalPass75CutGrade: 4.74 },
      },
    ],
  },
  {
    id: "acc",
    name: "회계학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.42, finalPass75CutGrade: 4.46 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.0, finalPass75CutGrade: 5.48 },
      },
    ],
  },
  {
    id: "tour",
    name: "관광경영학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.89, finalPass75CutGrade: 4.15 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.86, finalPass75CutGrade: 5.05 },
      },
    ],
  },
  {
    id: "econ",
    name: "경제학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.14, finalPass75CutGrade: 4.2 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.06, finalPass75CutGrade: 5.54 },
      },
    ],
  },
  {
    id: "trade",
    name: "무역학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.43, finalPass75CutGrade: 4.89 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.93, finalPass75CutGrade: 5.35 },
      },
    ],
  },
  {
    id: "int-trade",
    name: "국제통상학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.29, finalPass75CutGrade: 4.33 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.35, finalPass75CutGrade: 5.56 },
      },
    ],
  },
  {
    id: "urban",
    name: "도시계획·부동산학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.98, finalPass75CutGrade: 4.21 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.6, finalPass75CutGrade: 5.68 },
      },
    ],
  },
  {
    id: "policy",
    name: "정책학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.0, finalPass75CutGrade: 4.02 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.03, finalPass75CutGrade: 5.4 },
      },
    ],
  },
  {
    id: "local-gov",
    name: "자치행정학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.02, finalPass75CutGrade: 4.22 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.04, finalPass75CutGrade: 5.28 },
      },
    ],
  },
  // 자연과학대학
  {
    id: "math-phys",
    name: "수학물리학부(수학전공/물리·에너지전공)",
    college: "자연과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.42, finalPass75CutGrade: 4.91 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.71, finalPass75CutGrade: 7.73 },
      },
    ],
  },
  {
    id: "ds",
    name: "데이터사이언스학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.57, finalPass75CutGrade: 4.69 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.75, finalPass75CutGrade: 6.08 },
      },
    ],
  },
  {
    id: "atmos",
    name: "대기환경과학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.71, finalPass75CutGrade: 4.13 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.74, finalPass75CutGrade: 4.91 },
      },
    ],
  },
  {
    id: "chem-mat",
    name: "화학신소재학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.65, finalPass75CutGrade: 4.87 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.84, finalPass75CutGrade: 6.14 },
      },
    ],
  },
  {
    id: "bio",
    name: "생명과학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.96, finalPass75CutGrade: 4.33 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.93, finalPass75CutGrade: 5.39 },
      },
    ],
  },
  {
    id: "nat-free",
    name: "자연과학대학자유전공학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.0, finalPass75CutGrade: 5.19 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.52, finalPass75CutGrade: 6.54 },
      },
    ],
  },
  // 생명과학대학
  {
    id: "food",
    name: "식품영양학과",
    college: "생명과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.48, finalPass75CutGrade: 3.91 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.74, finalPass75CutGrade: 5.02 },
      },
    ],
  },
  {
    id: "ocean",
    name: "해양융합과학과",
    college: "생명과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.86, finalPass75CutGrade: 5.08 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.83, finalPass75CutGrade: 6.03 },
      },
    ],
  },
  {
    id: "aqua",
    name: "수산생명의학과",
    college: "생명과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.66, finalPass75CutGrade: 3.72 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.59, finalPass75CutGrade: 5.02 },
      },
    ],
  },
  {
    id: "plant",
    name: "식물생명과학과",
    college: "생명과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.81, finalPass75CutGrade: 4.11 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.51, finalPass75CutGrade: 5.78 },
      },
    ],
  },
  {
    id: "landscape",
    name: "환경조경학과",
    college: "생명과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.35, finalPass75CutGrade: 4.47 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.05, finalPass75CutGrade: 5.28 },
      },
    ],
  },
  {
    id: "bio-free",
    name: "생명과학대학자유전공학과",
    college: "생명과학대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.48, finalPass75CutGrade: 4.78 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.8, finalPass75CutGrade: 6.12 },
      },
    ],
  },
  // 공과대학
  {
    id: "semi",
    name: "전자·반도체공학부(전자공학전공/반도체공학전공)",
    college: "공과대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.14, finalPass75CutGrade: 4.4 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.57, finalPass75CutGrade: 5.66 },
      },
    ],
  },
  {
    id: "mat-eng",
    name: "신소재·생명화학공학부(세라믹신소재/신소재금속/생명화학)",
    college: "공과대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.74, finalPass75CutGrade: 4.93 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.9, finalPass75CutGrade: 6.18 },
      },
    ],
  },
  {
    id: "civil",
    name: "건설환경공학부(토목환경공학전공/스마트건설전공)",
    college: "공과대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.23, finalPass75CutGrade: 4.5 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.29, finalPass75CutGrade: 5.58 },
      },
    ],
  },
  // 예술체육대학
  {
    id: "art-des",
    name: "조형예술·디자인학과",
    college: "예술체육대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.54, finalPass75CutGrade: 4.98 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.09, finalPass75CutGrade: 5.85 },
      },
    ],
  },
  {
    id: "music",
    name: "음악학과",
    college: "예술체육대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: {},
      },
    ],
  },
  {
    id: "fashion",
    name: "패션디자인학과",
    college: "예술체육대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.77, finalPass75CutGrade: 3.96 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.54, finalPass75CutGrade: 5.51 },
      },
    ],
  },
  // 치과대학
  {
    id: "den-hyg",
    name: "치위생학과",
    college: "치과대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.15, finalPass75CutGrade: 3.21 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.33, finalPass75CutGrade: 4.53 },
      },
    ],
  },
  // 원주캠퍼스 이전 대상 학과 목록
  {
    id: "child",
    name: "유아교육과",
    college: "보건복지대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.07, finalPass75CutGrade: 4.2 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.82, finalPass75CutGrade: 5.1 },
      },
    ],
  },
  {
    id: "nursing",
    name: "간호학과",
    college: "보건복지대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.48, finalPass75CutGrade: 2.54 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.31, finalPass75CutGrade: 3.41 },
      },
    ],
  },
  {
    id: "soc-welf",
    name: "사회복지학과",
    college: "보건복지대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.48, finalPass75CutGrade: 3.66 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.67, finalPass75CutGrade: 4.78 },
      },
    ],
  },
  {
    id: "multi-cult",
    name: "다문화학과",
    college: "보건복지대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.36, finalPass75CutGrade: 4.59 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.07, finalPass75CutGrade: 5.35 },
      },
    ],
  },
  {
    id: "media",
    name: "디지털미디어커뮤니케이션학과",
    college: "보건복지대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.73, finalPass75CutGrade: 3.76 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.4, finalPass75CutGrade: 4.43 },
      },
    ],
  },
  {
    id: "ai-contents",
    name: "AI콘텐츠공학과",
    college: "과학기술대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.92, finalPass75CutGrade: 4.11 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.56, finalPass75CutGrade: 5.82 },
      },
    ],
  },
  {
    id: "elec",
    name: "전기공학과",
    college: "과학기술대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.53, finalPass75CutGrade: 3.89 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.07, finalPass75CutGrade: 5.16 },
      },
    ],
  },
  {
    id: "info-comm",
    name: "정보통신공학과",
    college: "과학기술대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.27, finalPass75CutGrade: 4.33 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.88, finalPass75CutGrade: 6.45 },
      },
    ],
  },
  {
    id: "ind-eng",
    name: "산업경영공학과",
    college: "과학기술대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.08, finalPass75CutGrade: 4.35 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.74, finalPass75CutGrade: 5.91 },
      },
    ],
  },
  {
    id: "sci-free",
    name: "자유전공학부(40명)",
    college: "과학기술대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.1, finalPass75CutGrade: 4.43 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.97, finalPass75CutGrade: 5.28 },
      },
    ],
  },
  {
    id: "cs",
    name: "컴퓨터공학과",
    college: "IT대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.92, finalPass75CutGrade: 4.15 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.0, finalPass75CutGrade: 5.5 },
      },
    ],
  },
  {
    id: "mech",
    name: "기계융합공학부",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "gyokwa-1",
        name: "학생부교과 (일반교과 I)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.29, finalPass75CutGrade: 4.47 },
      },
      {
        id: "jonghap-1",
        name: "학생부종합 (미래인재서류 I)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.83, finalPass75CutGrade: 5.97 },
      },
    ],
  },
];

const WONJU_DEPT_IDS = [
  "child",
  "nursing",
  "soc-welf",
  "multi-cult",
  "media",
  "ai-contents",
  "elec",
  "info-comm",
  "ind-eng",
  "cs",
  "sci-free",
  "mech",
];

const KANGWON_DEPARTMENTS = ALL_DEPARTMENTS.filter(
  (d) => !WONJU_DEPT_IDS.includes(d.id)
);
const WONJU_DEPARTMENTS = ALL_DEPARTMENTS.filter((d) =>
  WONJU_DEPT_IDS.includes(d.id)
);

// ==========================================
// 강원대학교 2026학년도 수시 입시결과 (일반 전형만)
// 출처: 사용자가 제공한 강원대학교 2026학년도 수시 입시결과 엑셀
// 교과: 학생부교과 > 일반교과전형 > 최종등록자 50%/75%컷
// 종합: 학생부종합 > 미래인재서류전형 > 최종등록자 50%/75%컷
// ==========================================
const CHUNCHEON_DEPARTMENTS: Department[] = [
  {
    id: "chuncheon_departments-1",
    name: "간호학과",
    college: "간호대학",
    admissions: [
      {
        id: "chuncheon_departments-1-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.51, finalPass75CutGrade: 2.55 },
      },
    ],
  },
  {
    id: "chuncheon_departments-2",
    name: "경영·회계학부",
    college: "경영대학",
    admissions: [
      {
        id: "chuncheon_departments-2-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.11, finalPass75CutGrade: 3.24 },
      },
      {
        id: "chuncheon_departments-2-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.44, finalPass75CutGrade: 3.57 },
      },
    ],
  },
  {
    id: "chuncheon_departments-3",
    name: "경제·정보통계학부",
    college: "경영대학",
    admissions: [
      {
        id: "chuncheon_departments-3-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.4, finalPass75CutGrade: 3.46 },
      },
      {
        id: "chuncheon_departments-3-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.42, finalPass75CutGrade: 3.5 },
      },
    ],
  },
  {
    id: "chuncheon_departments-4",
    name: "관광경영학과",
    college: "경영대학",
    admissions: [
      {
        id: "chuncheon_departments-4-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.34, finalPass75CutGrade: 3.42 },
      },
      {
        id: "chuncheon_departments-4-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.69, finalPass75CutGrade: 3.74 },
      },
    ],
  },
  {
    id: "chuncheon_departments-5",
    name: "국제무역학과",
    college: "경영대학",
    admissions: [
      {
        id: "chuncheon_departments-5-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.28, finalPass75CutGrade: 3.32 },
      },
      {
        id: "chuncheon_departments-5-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.56, finalPass75CutGrade: 3.64 },
      },
    ],
  },
  {
    id: "chuncheon_departments-6",
    name: "경영대학 자유전공학과",
    college: "경영대학",
    admissions: [
      {
        id: "chuncheon_departments-6-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.17, finalPass75CutGrade: 3.25 },
      },
    ],
  },
  {
    id: "chuncheon_departments-7",
    name: "스마트팜융합바이오시스템공학과",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-7-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.43, finalPass75CutGrade: 3.47 },
      },
      {
        id: "chuncheon_departments-7-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.52, finalPass75CutGrade: 3.79 },
      },
    ],
  },
  {
    id: "chuncheon_departments-8",
    name: "식품생명공학과",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-8-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.93, finalPass75CutGrade: 2.98 },
      },
      {
        id: "chuncheon_departments-8-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.37, finalPass75CutGrade: 3.47 },
      },
    ],
  },
  {
    id: "chuncheon_departments-9",
    name: "생물자원과학부",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-9-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.3, finalPass75CutGrade: 3.43 },
      },
      {
        id: "chuncheon_departments-9-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.64, finalPass75CutGrade: 3.99 },
      },
    ],
  },
  {
    id: "chuncheon_departments-10",
    name: "식품자원경제학과",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-10-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.62, finalPass75CutGrade: 3.65 },
      },
      {
        id: "chuncheon_departments-10-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.87, finalPass75CutGrade: 3.99 },
      },
    ],
  },
  {
    id: "chuncheon_departments-11",
    name: "원예학과",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-11-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.74, finalPass75CutGrade: 3.75 },
      },
      {
        id: "chuncheon_departments-11-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.95, finalPass75CutGrade: 4.06 },
      },
    ],
  },
  {
    id: "chuncheon_departments-12",
    name: "지역건설공학과",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-12-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.41, finalPass75CutGrade: 3.6 },
      },
      {
        id: "chuncheon_departments-12-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.76, finalPass75CutGrade: 3.79 },
      },
    ],
  },
  {
    id: "chuncheon_departments-13",
    name: "생명·환경융합학부",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-13-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.25, finalPass75CutGrade: 3.4 },
      },
      {
        id: "chuncheon_departments-13-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.65, finalPass75CutGrade: 3.7 },
      },
    ],
  },
  {
    id: "chuncheon_departments-14",
    name: "농업생명과학대학 자유전공학과",
    college: "농업생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-14-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.38, finalPass75CutGrade: 3.44 },
      },
    ],
  },
  {
    id: "chuncheon_departments-15",
    name: "동물산업융합학과",
    college: "동물생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-15-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.46, finalPass75CutGrade: 3.53 },
      },
      {
        id: "chuncheon_departments-15-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.98, finalPass75CutGrade: 4.03 },
      },
    ],
  },
  {
    id: "chuncheon_departments-16",
    name: "동물응용과학과",
    college: "동물생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-16-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.43, finalPass75CutGrade: 3.48 },
      },
      {
        id: "chuncheon_departments-16-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.91, finalPass75CutGrade: 4.12 },
      },
    ],
  },
  {
    id: "chuncheon_departments-17",
    name: "동물자원과학과",
    college: "동물생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-17-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.44, finalPass75CutGrade: 3.51 },
      },
      {
        id: "chuncheon_departments-17-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.63, finalPass75CutGrade: 3.77 },
      },
    ],
  },
  {
    id: "chuncheon_departments-18",
    name: "동물생명과학대학 자유전공학과",
    college: "동물생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-18-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.01, finalPass75CutGrade: 4.12 },
      },
    ],
  },
  {
    id: "chuncheon_departments-19",
    name: "건축학과(5년제)",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-19-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.76, finalPass75CutGrade: 2.77 },
      },
      {
        id: "chuncheon_departments-19-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.46, finalPass75CutGrade: 3.8 },
      },
    ],
  },
  {
    id: "chuncheon_departments-20",
    name: "건축공학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-20-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.38, finalPass75CutGrade: 3.42 },
      },
      {
        id: "chuncheon_departments-20-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.89, finalPass75CutGrade: 4.03 },
      },
    ],
  },
  {
    id: "chuncheon_departments-21",
    name: "토목공학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-21-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.59, finalPass75CutGrade: 3.7 },
      },
      {
        id: "chuncheon_departments-21-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.49, finalPass75CutGrade: 3.59 },
      },
    ],
  },
  {
    id: "chuncheon_departments-22",
    name: "환경공학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-22-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.26, finalPass75CutGrade: 3.4 },
      },
      {
        id: "chuncheon_departments-22-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.47, finalPass75CutGrade: 3.53 },
      },
    ],
  },
  {
    id: "chuncheon_departments-23",
    name: "기계융합공학부",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-23-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.4, finalPass75CutGrade: 3.51 },
      },
      {
        id: "chuncheon_departments-23-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.59, finalPass75CutGrade: 3.71 },
      },
    ],
  },
  {
    id: "chuncheon_departments-24",
    name: "배터리융합공학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-24-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.49, finalPass75CutGrade: 3.57 },
      },
      {
        id: "chuncheon_departments-24-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.69, finalPass75CutGrade: 3.75 },
      },
    ],
  },
  {
    id: "chuncheon_departments-25",
    name: "스마트산업공학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-25-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.71, finalPass75CutGrade: 3.75 },
      },
      {
        id: "chuncheon_departments-25-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.91, finalPass75CutGrade: 4 },
      },
    ],
  },
  {
    id: "chuncheon_departments-26",
    name: "에너지자원공학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-26-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.54, finalPass75CutGrade: 3.71 },
      },
      {
        id: "chuncheon_departments-26-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.67, finalPass75CutGrade: 3.69 },
      },
    ],
  },
  {
    id: "chuncheon_departments-27",
    name: "화공·생물공학부",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-27-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.13, finalPass75CutGrade: 3.21 },
      },
      {
        id: "chuncheon_departments-27-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.04, finalPass75CutGrade: 3.27 },
      },
    ],
  },
  {
    id: "chuncheon_departments-28",
    name: "영상문화학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-28-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.25, finalPass75CutGrade: 3.31 },
      },
      {
        id: "chuncheon_departments-28-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.42, finalPass75CutGrade: 3.7 },
      },
    ],
  },
  {
    id: "chuncheon_departments-29",
    name: "문화예술·공과대학 자유전공학과",
    college: "문화예술·공과대학",
    admissions: [
      {
        id: "chuncheon_departments-29-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.75, finalPass75CutGrade: 3.86 },
      },
    ],
  },
  {
    id: "chuncheon_departments-30",
    name: "교육학과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-30-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.42, finalPass75CutGrade: 3.43 },
      },
    ],
  },
  {
    id: "chuncheon_departments-31",
    name: "국어교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-31-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.67, finalPass75CutGrade: 2.77 },
      },
    ],
  },
  {
    id: "chuncheon_departments-32",
    name: "역사교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-32-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.52, finalPass75CutGrade: 2.6 },
      },
    ],
  },
  {
    id: "chuncheon_departments-33",
    name: "영어교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-33-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.06, finalPass75CutGrade: 3.15 },
      },
    ],
  },
  {
    id: "chuncheon_departments-34",
    name: "윤리교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-34-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.04, finalPass75CutGrade: 3.08 },
      },
    ],
  },
  {
    id: "chuncheon_departments-35",
    name: "일반사회교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-35-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.95, finalPass75CutGrade: 3.15 },
      },
    ],
  },
  {
    id: "chuncheon_departments-36",
    name: "지리교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-36-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.09, finalPass75CutGrade: 3.2 },
      },
    ],
  },
  {
    id: "chuncheon_departments-37",
    name: "가정교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-37-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.56, finalPass75CutGrade: 3.65 },
      },
    ],
  },
  {
    id: "chuncheon_departments-38",
    name: "과학교육학부",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-38-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.16, finalPass75CutGrade: 3.34 },
      },
    ],
  },
  {
    id: "chuncheon_departments-39",
    name: "수학교육과",
    college: "사범대학",
    admissions: [
      {
        id: "chuncheon_departments-39-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.62, finalPass75CutGrade: 3.73 },
      },
    ],
  },
  {
    id: "chuncheon_departments-40",
    name: "문화인류학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-40-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.5, finalPass75CutGrade: 3.5 },
      },
      {
        id: "chuncheon_departments-40-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.85, finalPass75CutGrade: 4.16 },
      },
    ],
  },
  {
    id: "chuncheon_departments-41",
    name: "미디어커뮤니케이션학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-41-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.93, finalPass75CutGrade: 3.06 },
      },
      {
        id: "chuncheon_departments-41-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.01, finalPass75CutGrade: 3.05 },
      },
    ],
  },
  {
    id: "chuncheon_departments-42",
    name: "부동산학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-42-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.4, finalPass75CutGrade: 3.43 },
      },
    ],
  },
  {
    id: "chuncheon_departments-43",
    name: "사회학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-43-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.11, finalPass75CutGrade: 3.3 },
      },
      {
        id: "chuncheon_departments-43-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.48, finalPass75CutGrade: 3.57 },
      },
    ],
  },
  {
    id: "chuncheon_departments-44",
    name: "정치외교학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-44-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.15, finalPass75CutGrade: 3.15 },
      },
      {
        id: "chuncheon_departments-44-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.36, finalPass75CutGrade: 3.8 },
      },
    ],
  },
  {
    id: "chuncheon_departments-45",
    name: "심리학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-45-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.68, finalPass75CutGrade: 2.74 },
      },
      {
        id: "chuncheon_departments-45-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.2, finalPass75CutGrade: 3.21 },
      },
    ],
  },
  {
    id: "chuncheon_departments-46",
    name: "행정학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-46-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.99, finalPass75CutGrade: 3.13 },
      },
      {
        id: "chuncheon_departments-46-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.13, finalPass75CutGrade: 3.33 },
      },
    ],
  },
  {
    id: "chuncheon_departments-47",
    name: "사회과학대학 자유전공학과",
    college: "사회과학대학",
    admissions: [
      {
        id: "chuncheon_departments-47-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.44, finalPass75CutGrade: 3.5 },
      },
    ],
  },
  {
    id: "chuncheon_departments-48",
    name: "산림바이오소재공학과",
    college: "산림환경과학대학",
    admissions: [
      {
        id: "chuncheon_departments-48-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.74, finalPass75CutGrade: 3.8 },
      },
      {
        id: "chuncheon_departments-48-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.51, finalPass75CutGrade: 3.75 },
      },
    ],
  },
  {
    id: "chuncheon_departments-49",
    name: "펄프제지공학과",
    college: "산림환경과학대학",
    admissions: [
      {
        id: "chuncheon_departments-49-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.78, finalPass75CutGrade: 3.82 },
      },
      {
        id: "chuncheon_departments-49-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.42, finalPass75CutGrade: 4.65 },
      },
    ],
  },
  {
    id: "chuncheon_departments-50",
    name: "산림경영학과",
    college: "산림환경과학대학",
    admissions: [
      {
        id: "chuncheon_departments-50-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.45, finalPass75CutGrade: 3.48 },
      },
      {
        id: "chuncheon_departments-50-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.86, finalPass75CutGrade: 4.16 },
      },
    ],
  },
  {
    id: "chuncheon_departments-51",
    name: "산림자원학과",
    college: "산림환경과학대학",
    admissions: [
      {
        id: "chuncheon_departments-51-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.28, finalPass75CutGrade: 3.33 },
      },
      {
        id: "chuncheon_departments-51-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.38, finalPass75CutGrade: 3.83 },
      },
    ],
  },
  {
    id: "chuncheon_departments-52",
    name: "산림환경보호학과",
    college: "산림환경과학대학",
    admissions: [
      {
        id: "chuncheon_departments-52-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.11, finalPass75CutGrade: 3.25 },
      },
      {
        id: "chuncheon_departments-52-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.48, finalPass75CutGrade: 3.57 },
      },
    ],
  },
  {
    id: "chuncheon_departments-53",
    name: "생태조경디자인학과",
    college: "산림환경과학대학",
    admissions: [
      {
        id: "chuncheon_departments-53-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.3, finalPass75CutGrade: 3.42 },
      },
      {
        id: "chuncheon_departments-53-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.01, finalPass75CutGrade: 3.44 },
      },
    ],
  },
  {
    id: "chuncheon_departments-54",
    name: "산림환경과학대학 자유전공학과",
    college: "산림환경과학대학",
    admissions: [
      {
        id: "chuncheon_departments-54-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.42, finalPass75CutGrade: 3.66 },
      },
    ],
  },
  {
    id: "chuncheon_departments-55",
    name: "수의학과",
    college: "수의과대학",
    admissions: [
      {
        id: "chuncheon_departments-55-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 1.21, finalPass75CutGrade: 1.23 },
      },
      {
        id: "chuncheon_departments-55-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 1.4, finalPass75CutGrade: 1.44 },
      },
    ],
  },
  {
    id: "chuncheon_departments-56",
    name: "약학과",
    college: "약학대학",
    admissions: [
      {
        id: "chuncheon_departments-56-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 1.1, finalPass75CutGrade: 1.12 },
      },
    ],
  },
  {
    id: "chuncheon_departments-57",
    name: "의예과",
    college: "의과대학",
    admissions: [
      {
        id: "chuncheon_departments-57-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 1, finalPass75CutGrade: 1.01 },
      },
    ],
  },
  {
    id: "chuncheon_departments-58",
    name: "분자생명과학과",
    college: "의생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-58-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.71, finalPass75CutGrade: 3.88 },
      },
      {
        id: "chuncheon_departments-58-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.6, finalPass75CutGrade: 3.74 },
      },
    ],
  },
  {
    id: "chuncheon_departments-59",
    name: "생명건강공학과",
    college: "의생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-59-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.36, finalPass75CutGrade: 3.45 },
      },
      {
        id: "chuncheon_departments-59-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.06, finalPass75CutGrade: 3.26 },
      },
    ],
  },
  {
    id: "chuncheon_departments-60",
    name: "생물의소재공학과",
    college: "의생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-60-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.52, finalPass75CutGrade: 3.58 },
      },
      {
        id: "chuncheon_departments-60-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.84, finalPass75CutGrade: 3.96 },
      },
    ],
  },
  {
    id: "chuncheon_departments-61",
    name: "의생명시스템과학과",
    college: "의생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-61-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.18, finalPass75CutGrade: 3.25 },
      },
      {
        id: "chuncheon_departments-61-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.04, finalPass75CutGrade: 3.18 },
      },
    ],
  },
  {
    id: "chuncheon_departments-62",
    name: "의생명공학과",
    college: "의생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-62-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.18, finalPass75CutGrade: 3.29 },
      },
      {
        id: "chuncheon_departments-62-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.3, finalPass75CutGrade: 3.38 },
      },
    ],
  },
  {
    id: "chuncheon_departments-63",
    name: "의생명과학대학 자유전공학과",
    college: "의생명과학대학",
    admissions: [
      {
        id: "chuncheon_departments-63-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.52, finalPass75CutGrade: 3.64 },
      },
    ],
  },
  {
    id: "chuncheon_departments-64",
    name: "국어국문학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-64-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.31, finalPass75CutGrade: 3.48 },
      },
      {
        id: "chuncheon_departments-64-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.58, finalPass75CutGrade: 3.91 },
      },
    ],
  },
  {
    id: "chuncheon_departments-65",
    name: "독어독문학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-65-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.57, finalPass75CutGrade: 3.73 },
      },
      {
        id: "chuncheon_departments-65-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.1, finalPass75CutGrade: 4.17 },
      },
    ],
  },
  {
    id: "chuncheon_departments-66",
    name: "불어불문학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-66-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.83, finalPass75CutGrade: 3.87 },
      },
      {
        id: "chuncheon_departments-66-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.64, finalPass75CutGrade: 3.84 },
      },
    ],
  },
  {
    id: "chuncheon_departments-67",
    name: "사학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-67-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.41, finalPass75CutGrade: 3.42 },
      },
      {
        id: "chuncheon_departments-67-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.38, finalPass75CutGrade: 3.5 },
      },
    ],
  },
  {
    id: "chuncheon_departments-68",
    name: "영어영문학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-68-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.02, finalPass75CutGrade: 3.26 },
      },
      {
        id: "chuncheon_departments-68-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.4, finalPass75CutGrade: 3.42 },
      },
    ],
  },
  {
    id: "chuncheon_departments-69",
    name: "일본학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-69-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.6, finalPass75CutGrade: 3.64 },
      },
      {
        id: "chuncheon_departments-69-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.8, finalPass75CutGrade: 3.88 },
      },
    ],
  },
  {
    id: "chuncheon_departments-70",
    name: "중어중문학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-70-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.64, finalPass75CutGrade: 3.78 },
      },
      {
        id: "chuncheon_departments-70-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.88, finalPass75CutGrade: 4.1 },
      },
    ],
  },
  {
    id: "chuncheon_departments-71",
    name: "철학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-71-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.31, finalPass75CutGrade: 3.38 },
      },
      {
        id: "chuncheon_departments-71-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.75, finalPass75CutGrade: 4.01 },
      },
    ],
  },
  {
    id: "chuncheon_departments-72",
    name: "인문대학 자유전공학과",
    college: "인문대학",
    admissions: [
      {
        id: "chuncheon_departments-72-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.76, finalPass75CutGrade: 3.82 },
      },
    ],
  },
  {
    id: "chuncheon_departments-73",
    name: "반도체물리학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "chuncheon_departments-73-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.58, finalPass75CutGrade: 3.81 },
      },
      {
        id: "chuncheon_departments-73-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.69, finalPass75CutGrade: 3.7 },
      },
    ],
  },
  {
    id: "chuncheon_departments-74",
    name: "생명과학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "chuncheon_departments-74-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.26, finalPass75CutGrade: 3.29 },
      },
      {
        id: "chuncheon_departments-74-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.25, finalPass75CutGrade: 3.29 },
      },
    ],
  },
  {
    id: "chuncheon_departments-75",
    name: "수학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "chuncheon_departments-75-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.56, finalPass75CutGrade: 3.77 },
      },
      {
        id: "chuncheon_departments-75-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.6, finalPass75CutGrade: 3.72 },
      },
    ],
  },
  {
    id: "chuncheon_departments-76",
    name: "지질·지구물리학부",
    college: "자연과학대학",
    admissions: [
      {
        id: "chuncheon_departments-76-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.52, finalPass75CutGrade: 3.68 },
      },
      {
        id: "chuncheon_departments-76-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.93, finalPass75CutGrade: 3.96 },
      },
    ],
  },
  {
    id: "chuncheon_departments-77",
    name: "화학·생화학부",
    college: "자연과학대학",
    admissions: [
      {
        id: "chuncheon_departments-77-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.25, finalPass75CutGrade: 3.31 },
      },
      {
        id: "chuncheon_departments-77-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.54, finalPass75CutGrade: 3.6 },
      },
    ],
  },
  {
    id: "chuncheon_departments-78",
    name: "자연과학대학 자유전공학과",
    college: "자연과학대학",
    admissions: [
      {
        id: "chuncheon_departments-78-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.93, finalPass75CutGrade: 4.14 },
      },
    ],
  },
  {
    id: "chuncheon_departments-79",
    name: "디지털밀리터리학과",
    college: "IT대학",
    admissions: [
      {
        id: "chuncheon_departments-79-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.71, finalPass75CutGrade: 3.88 },
      },
      {
        id: "chuncheon_departments-79-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.85, finalPass75CutGrade: 3.98 },
      },
    ],
  },
  {
    id: "chuncheon_departments-80",
    name: "전기전자공학과",
    college: "IT대학",
    admissions: [
      {
        id: "chuncheon_departments-80-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.16, finalPass75CutGrade: 3.24 },
      },
      {
        id: "chuncheon_departments-80-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.24, finalPass75CutGrade: 3.53 },
      },
    ],
  },
  {
    id: "chuncheon_departments-81",
    name: "전자공학과",
    college: "IT대학",
    admissions: [
      {
        id: "chuncheon_departments-81-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.43, finalPass75CutGrade: 3.44 },
      },
      {
        id: "chuncheon_departments-81-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.35, finalPass75CutGrade: 3.55 },
      },
    ],
  },
  {
    id: "chuncheon_departments-82",
    name: "컴퓨터공학과",
    college: "IT대학",
    admissions: [
      {
        id: "chuncheon_departments-82-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.46, finalPass75CutGrade: 3.68 },
      },
      {
        id: "chuncheon_departments-82-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.39, finalPass75CutGrade: 3.52 },
      },
    ],
  },
  {
    id: "chuncheon_departments-83",
    name: "AI융합학과",
    college: "IT대학",
    admissions: [
      {
        id: "chuncheon_departments-83-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.4, finalPass75CutGrade: 3.5 },
      },
      {
        id: "chuncheon_departments-83-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.7, finalPass75CutGrade: 3.72 },
      },
    ],
  },
  {
    id: "chuncheon_departments-84",
    name: "자유전공학부(인문계열)",
    college: "글로벌미래융합대학",
    admissions: [
      {
        id: "chuncheon_departments-84-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.13, finalPass75CutGrade: 3.16 },
      },
      {
        id: "chuncheon_departments-84-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.51, finalPass75CutGrade: 3.96 },
      },
    ],
  },
  {
    id: "chuncheon_departments-85",
    name: "자유전공학부(자연계열)",
    college: "글로벌미래융합대학",
    admissions: [
      {
        id: "chuncheon_departments-85-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.05, finalPass75CutGrade: 3.15 },
      },
      {
        id: "chuncheon_departments-85-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.4, finalPass75CutGrade: 3.48 },
      },
    ],
  },
];

const SAMCHEOK_DOGYE_DEPARTMENTS: Department[] = [
  {
    id: "samcheok_dogye_departments-1",
    name: "도시건축학과(5년제)",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-1-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.4, finalPass75CutGrade: 4.64 },
      },
      {
        id: "samcheok_dogye_departments-1-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.33, finalPass75CutGrade: 5.54 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-2",
    name: "미래토목건설공학과",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-2-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.82, finalPass75CutGrade: 6.06 },
      },
      {
        id: "samcheok_dogye_departments-2-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 7.99, finalPass75CutGrade: 8.02 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-3",
    name: "기계공학과",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-3-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 6, finalPass75CutGrade: 7 },
      },
      {
        id: "samcheok_dogye_departments-3-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.58, finalPass75CutGrade: 5.93 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-4",
    name: "그린에너지공학과",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-4-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 6.57, finalPass75CutGrade: 8.04 },
      },
      {
        id: "samcheok_dogye_departments-4-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 6.48, finalPass75CutGrade: 8.07 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-5",
    name: "전기공학과",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-5-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.61, finalPass75CutGrade: 4.87 },
      },
      {
        id: "samcheok_dogye_departments-5-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 6.14, finalPass75CutGrade: 6.95 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-6",
    name: "첨단AI공학과",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-6-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.97, finalPass75CutGrade: 7.2 },
      },
      {
        id: "samcheok_dogye_departments-6-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 6.42, finalPass75CutGrade: 8.1 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-7",
    name: "소방방재학부",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-7-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.84, finalPass75CutGrade: 5.05 },
      },
      {
        id: "samcheok_dogye_departments-7-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.16, finalPass75CutGrade: 5.53 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-8",
    name: "공학대학 자유전공학과",
    college: "공학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-8-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 6.67, finalPass75CutGrade: 7.14 },
      },
      {
        id: "samcheok_dogye_departments-8-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 6.08, finalPass75CutGrade: 6.11 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-9",
    name: "사회복지학과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-9-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.82, finalPass75CutGrade: 4.12 },
      },
      {
        id: "samcheok_dogye_departments-9-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.62, finalPass75CutGrade: 5.3 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-10",
    name: "유아교육과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-10-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.84, finalPass75CutGrade: 4.88 },
      },
      {
        id: "samcheok_dogye_departments-10-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.71, finalPass75CutGrade: 4.78 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-11",
    name: "일본학과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-11-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.64, finalPass75CutGrade: 5.15 },
      },
      {
        id: "samcheok_dogye_departments-11-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.77, finalPass75CutGrade: 5.99 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-12",
    name: "공공행정학과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-12-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.97, finalPass75CutGrade: 5.24 },
      },
      {
        id: "samcheok_dogye_departments-12-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.64, finalPass75CutGrade: 4.07 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-13",
    name: "관광학과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-13-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.37, finalPass75CutGrade: 5.77 },
      },
      {
        id: "samcheok_dogye_departments-13-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.5, finalPass75CutGrade: 6.7 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-14",
    name: "경제금융학과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-14-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.08, finalPass75CutGrade: 5.83 },
      },
      {
        id: "samcheok_dogye_departments-14-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.62, finalPass75CutGrade: 5.14 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-15",
    name: "영어과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-15-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.5, finalPass75CutGrade: 6.85 },
      },
      {
        id: "samcheok_dogye_departments-15-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 8.01, finalPass75CutGrade: 8.14 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-16",
    name: "인문사회대학 자유전공학과",
    college: "인문사회대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-16-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.16, finalPass75CutGrade: 5.2 },
      },
      {
        id: "samcheok_dogye_departments-16-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.41, finalPass75CutGrade: 4.52 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-17",
    name: "휴먼스포츠학과",
    college: "디자인스포츠대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-17-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.45, finalPass75CutGrade: 4.6 },
      },
      {
        id: "samcheok_dogye_departments-17-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.69, finalPass75CutGrade: 5.07 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-18",
    name: "간호학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-18-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.74, finalPass75CutGrade: 3 },
      },
      {
        id: "samcheok_dogye_departments-18-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.58, finalPass75CutGrade: 4 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-19",
    name: "물리치료학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-19-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.75, finalPass75CutGrade: 2.96 },
      },
      {
        id: "samcheok_dogye_departments-19-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.34, finalPass75CutGrade: 3.65 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-20",
    name: "방사선학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-20-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 2.39, finalPass75CutGrade: 2.43 },
      },
      {
        id: "samcheok_dogye_departments-20-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 3.65, finalPass75CutGrade: 4.12 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-21",
    name: "바이오기능성소재학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-21-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 6.74, finalPass75CutGrade: 7.6 },
      },
      {
        id: "samcheok_dogye_departments-21-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 6.39, finalPass75CutGrade: 6.39 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-22",
    name: "식품영양학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-22-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 4.26, finalPass75CutGrade: 4.52 },
      },
      {
        id: "samcheok_dogye_departments-22-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 6.19, finalPass75CutGrade: 6.87 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-23",
    name: "안경광학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-23-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.65, finalPass75CutGrade: 6.07 },
      },
      {
        id: "samcheok_dogye_departments-23-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.66, finalPass75CutGrade: 6.13 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-24",
    name: "응급구조학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-24-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.37, finalPass75CutGrade: 3.44 },
      },
      {
        id: "samcheok_dogye_departments-24-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.21, finalPass75CutGrade: 4.29 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-25",
    name: "작업치료학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-25-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.77, finalPass75CutGrade: 4 },
      },
      {
        id: "samcheok_dogye_departments-25-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.98, finalPass75CutGrade: 5.41 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-26",
    name: "치위생학과",
    college: "보건과학대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-26-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 3.91, finalPass75CutGrade: 3.95 },
      },
      {
        id: "samcheok_dogye_departments-26-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 4.5, finalPass75CutGrade: 4.71 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-27",
    name: "자유전공학부(인문계열)",
    college: "독립학부(삼척/도계)",
    admissions: [
      {
        id: "samcheok_dogye_departments-27-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 5.64, finalPass75CutGrade: 6.14 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-28",
    name: "자유전공학부(자연계열)",
    college: "독립학부(삼척/도계)",
    admissions: [
      {
        id: "samcheok_dogye_departments-28-gyokwa",
        name: "학생부교과 (일반교과전형)",
        category: "교과",
        cutoffs: { finalPass50CutGrade: 6.35, finalPass75CutGrade: 6.71 },
      },
    ],
  },
  {
    id: "samcheok_dogye_departments-29",
    name: "생활조형디자인학과",
    college: "디자인스포츠대학",
    admissions: [
      {
        id: "samcheok_dogye_departments-29-jonghap",
        name: "학생부종합 (미래인재서류전형)",
        category: "종합",
        cutoffs: { finalPass50CutGrade: 5.96, finalPass75CutGrade: 6.26 },
      },
    ],
  },
];

// ==========================================
// 단국대학교 2026학년도 수시 입시결과
// 출처: 사용자가 제공한 단국대학교 죽전/천안캠퍼스 입시결과 PDF
// - 예측에 사용하는 값은 표의 학생부 환산등급 50%/70% 컷
// - "3명 이하 모집단위 미제출" 등 컷이 없는 모집단위는 등록하지 않음
// - 첨부 자료에 교과 "면접" 전형은 확인되지 않아 임의로 생성하지 않음
// ==========================================

type DankookRow = [string, number, number];

const makeDankookDepartments = (
  rows: DankookRow[],
  admissionId: string,
  admissionName: string,
  category: "교과" | "종합",
  college: string
): Department[] =>
  rows.map(([name, cut50, cut70], index) => ({
    id: `${admissionId}-dept-${index + 1}`,
    name,
    college,
    admissions: [
      {
        id: `${admissionId}-${index + 1}`,
        name: admissionName,
        category,
        cutoffs: {
          finalPass50CutGrade: cut50,
          finalPass75CutGrade: cut70,
          secondCutPercent: 70,
        },
      },
    ],
  }));

const DANKOOK_JUKJEON_GYOKWA_REGION: DankookRow[] = [
  ["통계데이터사이언스학과", 2.47, 2.48],
  ["고분자시스템공학부 융합소재공학전공", 2.23, 2.3],
  ["사회계열광역", 2.32, 2.36],
  ["국어국문학과", 2.33, 2.39],
  ["사학과", 2.39, 2.39],
  ["국제경영학과", 2.38, 2.41],
  ["건축학부 건축학전공(5년제)", 2.38, 2.4],
  ["건축학부 건축공학전공", 2.28, 2.35],
  ["체육교육과", 3.26, 3.46],
  ["수학교육과", 2.18, 2.4],
  ["과학교육과", 2.06, 2.11],
  ["한문교육과", 2.54, 2.54],
  ["특수교육과", 2.36, 2.36],
  ["전자전기공학과", 2.29, 2.3],
  ["기계공학과", 2.24, 2.25],
  ["화학공학과", 2.07, 2.1],
  ["사이버보안학과", 2.47, 2.5],
  ["소프트웨어학과", 2.3, 2.3],
  ["고분자시스템공학부 고분자공학전공", 2.19, 2.21],
  ["컴퓨터공학과", 2.16, 2.41],
  ["인공지능학과", 2.44, 2.51],
  ["영미인문학과", 2.55, 2.64],
  ["융합반도체공학과", 2.2, 2.26],
  ["인프라건설공학과", 2.35, 2.36],
];

const DANKOOK_JUKJEON_JONGHAP_SEORYU: DankookRow[] = [
  ["건축학부 건축공학전공", 2.83, 2.84],
  ["건축학부 건축학전공(5년제)", 2.88, 2.95],
  ["경영학부", 2.66, 2.78],
  ["수학교육과", 2.21, 2.24],
  ["정치외교학과", 2.74, 2.77],
  ["행정학과", 2.68, 2.74],
  ["특수교육과", 2.11, 2.11],
  ["한문교육과", 2.86, 2.86],
  ["과학교육과", 2.47, 2.78],
  ["인문계열광역", 3.12, 3.31],
  ["사회계열광역", 2.81, 2.89],
  ["고분자시스템공학부 융합소재공학전공", 2.82, 2.88],
  ["인프라건설공학과", 2.75, 2.78],
  ["국제경영학과", 2.98, 3.03],
  ["모바일시스템공학과", 3.46, 3.46],
  ["상담학과", 2.9, 3.11],
  ["고분자시스템공학부 고분자공학전공", 2.82, 2.82],
  ["도시계획·부동산학부", 2.6, 2.63],
  ["융합반도체공학과", 2.77, 2.95],
  ["미디어커뮤니케이션학부", 2.28, 2.53],
  ["경제학과", 2.63, 2.75],
  ["무역학과", 2.77, 2.92],
  ["법학과", 2.55, 2.67],
  ["전자전기공학과", 2.6, 2.84],
  ["화학공학과", 2.49, 2.54],
  ["기계공학과", 2.8, 2.85],
];

const DANKOOK_JUKJEON_JONGHAP_GIBUN: DankookRow[] = [
  ["인문계열광역", 5.1, 5.41],
  ["사회계열광역", 3.65, 3.96],
  ["전자전기공학과", 3.3, 3.3],
  ["화학공학과", 3.32, 3.32],
];

const DANKOOK_JUKJEON_JONGHAP_MYEONJEOP: DankookRow[] = [
  ["건축학부 건축공학전공", 2.97, 2.97],
  ["건축학부 건축학전공(5년제)", 2.87, 2.98],
  ["철학과", 2.85, 2.85],
  ["경영학부", 2.86, 2.94],
  ["수학교육과", 2.32, 2.33],
  ["과학교육과", 2.72, 2.72],
  ["정치외교학과", 3.11, 3.61],
  ["행정학과", 3.66, 3.87],
  ["특수교육과", 3.26, 3.37],
  ["한문교육과", 3.19, 3.19],
  ["고분자시스템공학부 융합소재공학전공", 3.01, 3.09],
  ["인프라건설공학과", 3.06, 3.12],
  ["국어국문학과", 2.79, 2.82],
  ["국제경영학과", 3.09, 3.11],
  ["모바일시스템공학과", 3.07, 3.07],
  ["상담학과", 3.31, 3.33],
  ["사학과", 2.63, 2.87],
  ["영미인문학과", 3.02, 3.03],
  ["고분자시스템공학부 고분자공학전공", 2.82, 2.93],
  ["도시계획·부동산학부", 2.86, 3.01],
  ["융합반도체공학과", 3.12, 3.43],
  ["미디어커뮤니케이션학부", 2.71, 2.74],
  ["경제학과", 2.65, 2.87],
  ["무역학과", 3.51, 4.77],
  ["법학과", 2.81, 2.86],
  ["전자전기공학과", 2.69, 2.82],
  ["화학공학과", 2.97, 3.06],
  ["기계공학과", 2.96, 2.98],
];

const DANKOOK_CHEONAN_GYOKWA_GENERAL: DankookRow[] = [
  ["코스메디컬조제학과", 3.01, 3.03],
  ["유럽중남미학부 포르투갈브라질학전공", 3.45, 3.59],
  ["유럽중남미학부 러시아학전공", 3.68, 3.74],
  ["유럽중남미학부 스페인중남미학전공", 3.36, 3.58],
  ["유럽중남미학부 프랑스학전공", 3.32, 3.48],
  ["유럽중남미학부 독일학전공", 3.27, 3.36],
  ["에너지공학과", 2.81, 3.22],
  ["사회복지학과", 3.31, 3.58],
  ["아시아중동학부 중동학전공", 3.4, 3.54],
  ["국제스포츠학부 운동처방재활전공", 2.36, 2.61],
  ["보건행정학과", 2.83, 3.08],
  ["공공정책학과", 2.96, 3.05],
  ["공공정책학과(야)", 4.32, 4.36],
  ["스포츠경영학과", 2.73, 2.73],
  ["영어과", 2.94, 3.08],
  ["심리학과", 2.7, 2.71],
  ["생명공학부 동물생명공학전공", 2.71, 2.87],
  ["인문사회계열광역", 3.22, 3.27],
  ["자연공학계열광역", 3.15, 3.18],
  ["생명공학부 식량생명공학전공", 3.02, 3.16],
  ["생명공학부 환경원예학전공", 3.13, 3.22],
  ["아시아중동학부 몽골어전공", 3.51, 3.62],
  ["아시아중동학부 중국학전공", 3.67, 3.72],
  ["아시아중동학부 일본학전공", 3.15, 3.31],
  ["아시아중동학부 베트남학전공", 3.74, 3.76],
  ["의생명과학부 의생명시스템학전공", 2.38, 2.55],
  ["의생명과학부 생명과학전공", 2.5, 2.57],
  ["의생명과학부 미생물학전공", 2.72, 2.77],
  ["물리학과", 3.38, 3.41],
  ["치위생학과", 2.84, 2.88],
  ["간호학과", 2.31, 2.36],
  ["임상병리학과", 2.52, 2.64],
  ["물리치료학과", 1.72, 2.19],
  ["식품공학과", 2.55, 2.67],
  ["식품영양학과", 2.84, 3.03],
  ["수학과", 3.21, 3.44],
  ["신소재공학과", 2.7, 2.88],
  ["경영공학과", 3.02, 3.06],
  ["제약공학과", 2.4, 2.46],
  ["식품자원경제학과", 3.2, 3.29],
  ["화학과", 3.06, 3.63],
  ["글로벌한국어과", 3.29, 3.29],
  ["생명공학부 녹지조경학전공", 3.36, 3.36],
];

const DANKOOK_CHEONAN_GYOKWA_REGION_BIO: DankookRow[] = [
  ["의예과", 1.21, 1.33],
  ["치의예과", 1.25, 1.28],
  ["약학과", 1.25, 1.28],
];

const DANKOOK_CHEONAN_JONGHAP_SEORYU: DankookRow[] = [
  ["코스메디컬조제학과", 3.66, 3.68],
  ["유럽중남미학부 프랑스학전공", 4.6, 4.99],
  ["유럽중남미학부 독일학전공", 4.84, 4.9],
  ["에너지공학과", 3.64, 3.75],
  ["사회복지학과", 3.7, 3.81],
  ["아시아중동학부 중동학전공", 4.63, 4.78],
  ["아시아중동학부 중국학전공", 3.97, 4.46],
  ["아시아중동학부 몽골어전공", 4.59, 4.61],
  ["유럽중남미학부 포르투갈브라질학전공", 4.26, 4.51],
  ["유럽중남미학부 러시아학전공", 4.2, 4.22],
  ["유럽중남미학부 스페인중남미학전공", 4.27, 4.37],
  ["보건행정학과", 3.45, 3.6],
  ["인문사회계열광역", 3.95, 4.08],
  ["자연공학계열광역", 3.67, 3.78],
  ["생명공학부 식량생명공학전공", 3.68, 3.72],
  ["생명공학부 환경원예학전공", 3.99, 4.01],
  ["생명공학부 녹지조경학전공", 4.35, 4.39],
  ["공공정책학과", 3.47, 3.56],
  ["공공정책학과(야)", 4.58, 4.74],
  ["영어과", 3.65, 3.76],
  ["심리학과", 3.42, 3.47],
  ["생명공학부 동물생명공학전공", 3.4, 3.55],
  ["물리학과", 3.87, 4.28],
  ["치위생학과", 3.15, 3.42],
  ["간호학과", 2.45, 2.46],
  ["임상병리학과", 3.03, 3.18],
  ["물리치료학과", 3.02, 3.09],
  ["아시아중동학부 베트남학전공", 4.7, 4.94],
  ["의생명과학부 의생명시스템학전공", 3.01, 3.18],
  ["의생명과학부 생명과학전공", 3.01, 3.12],
  ["의생명과학부 미생물학전공", 3.29, 3.33],
  ["식품공학과", 3.59, 3.64],
  ["제약공학과", 2.92, 3.19],
  ["식품자원경제학과", 3.87, 3.98],
  ["화학과", 3.45, 3.51],
  ["글로벌한국어과", 4.11, 4.11],
  ["아시아중동학부 일본학전공", 4.08, 4.09],
  ["식품영양학과", 3.47, 3.52],
  ["수학과", 3.61, 3.86],
  ["신소재공학과", 3.57, 3.61],
  ["경영공학과", 4.13, 4.16],
];

const DANKOOK_CHEONAN_JONGHAP_GIBUN: DankookRow[] = [
  ["인문사회계열광역", 4.54, 5.06],
  ["자연공학계열광역", 4.49, 4.78],
];

const DANKOOK_CHEONAN_JONGHAP_MYEONJEOP: DankookRow[] = [
  ["문예창작과", 3.48, 3.62],
  ["의예과", 1.2, 1.27],
  ["치의예과", 1.39, 1.42],
  ["약학과", 1.36, 1.47],
];

const mergeDankookDepartments = (...groups: Department[][]): Department[] => {
  const merged = new Map<string, Department>();
  groups.flat().forEach((dept) => {
    const existing = merged.get(dept.name);
    if (existing) {
      existing.admissions.push(...dept.admissions);
    } else {
      merged.set(dept.name, { ...dept, admissions: [...dept.admissions] });
    }
  });
  return Array.from(merged.values());
};

const DANKOOK_JUKJEON_DEPARTMENTS: Department[] = mergeDankookDepartments(
  makeDankookDepartments(
    DANKOOK_JUKJEON_GYOKWA_REGION,
    "dankook-jukjeon-gyokwa-region",
    "학생부교과 (지역균형선발)",
    "교과",
    "단국대학교 죽전캠퍼스"
  ),
  makeDankookDepartments(
    DANKOOK_JUKJEON_JONGHAP_SEORYU,
    "dankook-jukjeon-jonghap-seoryu",
    "학생부종합 (DKU인재-서류형)",
    "종합",
    "단국대학교 죽전캠퍼스"
  ),
  makeDankookDepartments(
    DANKOOK_JUKJEON_JONGHAP_GIBUN,
    "dankook-jukjeon-jonghap-gibun",
    "학생부종합 (기회균형선발)",
    "종합",
    "단국대학교 죽전캠퍼스"
  ),
  makeDankookDepartments(
    DANKOOK_JUKJEON_JONGHAP_MYEONJEOP,
    "dankook-jukjeon-jonghap-myeonjeop",
    "학생부종합 (DKU인재-면접형)",
    "종합",
    "단국대학교 죽전캠퍼스"
  )
);

const DANKOOK_CHEONAN_DEPARTMENTS: Department[] = mergeDankookDepartments(
  makeDankookDepartments(
    DANKOOK_CHEONAN_GYOKWA_GENERAL,
    "dankook-cheonan-gyokwa-general",
    "학생부교과 (학생부교과우수자)",
    "교과",
    "단국대학교 천안캠퍼스"
  ),
  makeDankookDepartments(
    DANKOOK_CHEONAN_GYOKWA_REGION_BIO,
    "dankook-cheonan-gyokwa-region-bio",
    "학생부교과 (지역메디바이오인재)",
    "교과",
    "단국대학교 천안캠퍼스"
  ),
  makeDankookDepartments(
    DANKOOK_CHEONAN_JONGHAP_SEORYU,
    "dankook-cheonan-jonghap-seoryu",
    "학생부종합 (DKU인재-서류형)",
    "종합",
    "단국대학교 천안캠퍼스"
  ),
  makeDankookDepartments(
    DANKOOK_CHEONAN_JONGHAP_GIBUN,
    "dankook-cheonan-jonghap-gibun",
    "학생부종합 (기회균형선발)",
    "종합",
    "단국대학교 천안캠퍼스"
  ),
  makeDankookDepartments(
    DANKOOK_CHEONAN_JONGHAP_MYEONJEOP,
    "dankook-cheonan-jonghap-myeonjeop",
    "학생부종합 (DKU인재-면접형)",
    "종합",
    "단국대학교 천안캠퍼스"
  )
);

// ==========================================
// 숭실대 / 한신대 / 성결대 2026학년도 수시 입시결과 추가
// - 예측에는 학생부 환산등급 50% / 70% 컷을 사용
// - 각 대학의 대표 일반전형을 우선 반영
// ==========================================

type ExtraUnivRow = [string, number, number];

const makeExtraUnivDepartments = (
  rows: ExtraUnivRow[],
  admissionId: string,
  admissionName: string,
  category: "교과" | "종합",
  college: string
): Department[] =>
  rows.map(([name, cut50, cut70], index) => ({
    id: `${admissionId}-dept-${index + 1}`,
    name,
    college,
    admissions: [
      {
        id: `${admissionId}-${index + 1}`,
        name: admissionName,
        category,
        cutoffs: {
          finalPass50CutGrade: cut50,
          finalPass75CutGrade: cut70,
          secondCutPercent: 70,
        },
      },
    ],
  }));

// 숭실대학교 - 학생부교과(학생부우수자전형)
const SOONGSIL_GYOKWA: ExtraUnivRow[] = [
  ["AI소프트웨어학부", 1.94, 2.06],
  ["국제법무학과", 2.15, 2.24],
  ["법학과", 2.05, 2.34],
  ["사회복지학부", 2.28, 2.3],
  ["정보사회학과", 2.28, 2.28],
  ["정치외교학과", 2.22, 2.22],
  ["행정학부", 2.12, 2.26],
  ["평생교육학과", 2.32, 2.32],
  ["건축학부 실내건축전공", 2.43, 2.47],
  ["철학과", 2.21, 2.25],
  ["자유전공학부(인문)", 1.86, 1.95],
  ["경영학부", 2.07, 2.16],
  ["중어중문학과", 2.22, 2.34],
  ["영어영문학과", 2.2, 2.21],
  ["독어독문학과", 2.3, 2.3],
  ["불어불문학과", 2.39, 2.44],
  ["사학과", 2.45, 2.45],
  ["국어국문학과", 2.3, 2.33],
  ["일어일문학과", 2.34, 2.37],
  ["글로벌통상학과", 2.19, 2.3],
  ["금융학부", 2.29, 2.29],
  ["회계학과", 2.05, 2.1],
  ["정보통계·보험수리학과", 2.17, 2.28],
  ["물리학과", 1.92, 2.07],
  ["자유전공학부(자연)", 1.91, 1.95],
  ["전자정보공학부 IT융합전공", 2.18, 2.28],
  ["전자정보공학부 전자공학전공", 1.95, 2.04],
  ["수학과", 2.12, 2.23],
  ["신소재공학과", 2.05, 2.11],
  ["컴퓨터학부", 1.98, 2.05],
  ["글로벌미디어학부", 2.25, 2.32],
  ["산업·정보시스템공학과", 2.11, 2.2],
  ["화학공학과", 1.95, 2.0],
  ["의생명시스템학부", 1.8, 1.81],
  ["화학과", 1.95, 1.97],
  ["기계공학부", 2.16, 2.19],
  ["전기공학부", 2.13, 2.16],
  ["벤처중소기업학과", 2.36, 2.39],
  ["경제학과", 2.12, 2.28],
  ["언론홍보학과", 2.03, 2.17],
  ["건축학부 건축학-건축공학전공", 2.3, 2.33],
];

// 숭실대학교 - 학생부종합(SSU미래인재전형)
const SOONGSIL_JONGHAP: ExtraUnivRow[] = [
  ["소프트웨어학부", 2.5, 2.72],
  ["경영학부", 2.84, 3.0],
  ["철학과", 3.13, 3.18],
  ["건축학부 실내건축전공", 3.18, 3.27],
  ["평생교육학과", 2.98, 3.13],
  ["행정학부", 2.81, 2.82],
  ["정치외교학과", 2.56, 2.71],
  ["정보보호학과", 2.51, 2.55],
  ["정보사회학과", 2.56, 2.59],
  ["사회복지학부", 3.07, 3.24],
  ["중어중문학과", 3.44, 3.48],
  ["건축학부 건축학-건축공학전공", 2.85, 2.94],
  ["일어일문학과", 4.53, 4.81],
  ["국어국문학과", 2.57, 2.63],
  ["기독교학과", 4.13, 4.27],
  ["사학과", 2.55, 2.67],
  ["불어불문학과", 3.37, 4.69],
  ["독어독문학과", 3.8, 4.33],
  ["영어영문학과", 3.09, 3.35],
  ["법학과", 2.89, 3.02],
  ["의생명시스템학부", 2.46, 2.49],
  ["화학공학과", 2.48, 2.55],
  ["산업·정보시스템공학과", 2.78, 2.82],
  ["글로벌미디어학부", 2.65, 2.8],
  ["컴퓨터학부", 2.32, 2.43],
  ["신소재공학과", 2.67, 2.74],
  ["수학과", 2.51, 2.79],
  ["전자정보공학부 전자공학전공", 2.59, 2.66],
  ["전자정보공학부 IT융합전공", 2.59, 2.68],
  ["물리학과", 2.89, 3.05],
  ["정보통계·보험수리학과", 2.59, 2.76],
  ["화학과", 2.39, 2.59],
  ["국제법무학과", 2.9, 2.94],
  ["글로벌통상학과", 2.97, 3.29],
  ["금융학부", 2.75, 2.86],
  ["회계학과", 2.84, 3.08],
  ["언론홍보학과", 2.45, 2.5],
  ["경제학과", 2.67, 2.74],
  ["벤처중소기업학과", 2.87, 3.02],
  ["전기공학부", 2.88, 2.97],
  ["기계공학부", 2.77, 2.98],
];

// 성결대학교 - 2026학년도 학생부교과(교과성적우수자전형)
// 출처: 사용자가 제공한 성결대학교 입시결과 PDF / 대입정보포털 2026 결과
const SUNGKYUL_GYOKWA: ExtraUnivRow[] = [
  ["뷰티디자인학과", 1.8, 2.6],
  ["중어중문학과", 3.0, 3.2],
  ["경영학과", 2.0, 2.4],
  ["유아교육과", 2.2, 2.8],
  ["행정학부", 3.0, 3.4],
  ["영어영문학과", 3.0, 3.4],
  ["인문사회계열자율전공학부", 3.0, 3.4],
  ["공학계열자율전공학부", 3.2, 3.4],
  ["도시디자인정보공학과", 2.8, 3.2],
  ["국어국문학과", 2.6, 2.8],
  ["글로벌물류학과", 3.4, 3.6],
  ["정보통신공학과", 3.2, 3.4],
  ["컴퓨터AI공학과", 2.4, 2.8],
  ["기독교교육상담학과", 3.8, 4.2],
  ["융합학부", 2.8, 3.4],
  ["미디어소프트웨어학과", 3.0, 3.4],
  ["국제개발협력학과", 3.2, 3.6],
  ["사회복지학과", 2.4, 3.0],
  ["관광학과", 3.0, 3.4],
  ["자율전공학부", 3.0, 3.2],
  ["산업경영공학과", 3.4, 3.8],
];

// 성결대학교 - 2026학년도 학생부교과(SKU창의적인재전형)
const SUNGKYUL_SKU_CREATIVE: ExtraUnivRow[] = [
  ["중어중문학과", 4.8, 5.2],
  ["경영학과", 3.8, 4.4],
  ["유아교육과", 3.4, 3.8],
  ["행정학부", 4.4, 5.6],
  ["공학계열자율전공학부", 4.4, 5.6],
  ["국제개발협력학과", 4.6, 5.4],
  ["국어국문학과", 4.4, 4.8],
  ["글로벌물류학과", 4.8, 5.6],
  ["영어영문학과", 4.4, 5.0],
  ["도시디자인정보공학과", 4.4, 5.2],
  ["컴퓨터AI공학과", 3.4, 5.0],
  ["미디어소프트웨어학과", 4.4, 5.0],
  ["뷰티디자인학과", 3.6, 4.0],
  ["사회복지학과", 4.2, 4.6],
  ["관광학과", 4.4, 5.0],
  ["산업경영공학과", 5.0, 5.6],
  ["정보통신공학과", 4.8, 5.8],
  ["인문사회계열자율전공학부", 4.4, 5.0],
  ["컴퓨터공학과", 3.4, 5.0],
];

// 성결대학교 - 2026학년도 학생부종합(영암 학생부종합전형)
const SUNGKYUL_JONGHAP: ExtraUnivRow[] = [
  ["자율전공학부", 4.0, 5.4],
  ["공학계열자율전공학부", 4.2, 5.0],
  ["인문사회계열자율전공학부", 3.8, 5.0],
];

const mergeExtraUnivDepartments = (...groups: Department[][]): Department[] => {
  const merged = new Map<string, Department>();
  groups.flat().forEach((dept) => {
    const existing = merged.get(dept.name);
    if (existing) {
      existing.admissions.push(...dept.admissions);
    } else {
      merged.set(dept.name, { ...dept, admissions: [...dept.admissions] });
    }
  });
  return Array.from(merged.values());
};

const SOONGSIL_DEPARTMENTS = mergeExtraUnivDepartments(
  makeExtraUnivDepartments(
    SOONGSIL_GYOKWA,
    "soongsil-gyokwa",
    "학생부교과 (학생부우수자전형)",
    "교과",
    "숭실대학교"
  ),
  makeExtraUnivDepartments(
    SOONGSIL_JONGHAP,
    "soongsil-jonghap",
    "학생부종합 (SSU미래인재전형)",
    "종합",
    "숭실대학교"
  )
);

const SUNGKYUL_DEPARTMENTS = mergeExtraUnivDepartments(
  makeExtraUnivDepartments(
    SUNGKYUL_GYOKWA,
    "sungkyul-gyokwa",
    "학생부교과 (교과성적우수자전형)",
    "교과",
    "성결대학교"
  ),
  makeExtraUnivDepartments(
    SUNGKYUL_SKU_CREATIVE,
    "sungkyul-sku-creative",
    "학생부교과 (SKU창의적인재전형) (면접)",
    "교과",
    "성결대학교"
  ),
  makeExtraUnivDepartments(
    SUNGKYUL_JONGHAP,
    "sungkyul-jonghap",
    "학생부종합 (영암 학생부종합전형)",
    "종합",
    "성결대학교"
  )
);

// 한신대학교 - 2026학년도 학생부교과 입시결과 추가
// 출처: 사용자가 제공한 대입정보포털 한신대학교 전형결과 자료
// 원자료의 환산등급 50% / 70% 컷을 그대로 반영

const HANSIN_GYOKWA_NONGEOCHON: ExtraUnivRow[] = [
  ["사회복지학", 4.52, 4.52],
  ["경영계열", 4.2, 4.2],
  ["미디어계열", 3.51, 3.77],
  ["심리·아동학", 3.61, 3.61],
  ["디지털영상문화콘텐츠학", 3.83, 3.83],
  ["AI·SW계열", 4.39, 5.82],
];

const HANSIN_GYOKWA_SPECIAL_EDUCATION: ExtraUnivRow[] = [
  ["특수체육학", 4.29, 3.79],
];

const HANSIN_GYOKWA_SOCIETY_SUPPORT: ExtraUnivRow[] = [
  ["경영계열", 2.6, 2.6],
  ["자유전공학부", 4.1, 4.25],
  ["미디어계열", 3.38, 3.38],
  ["문화콘텐츠계열", 3.56, 3.82],
  ["휴먼서비스계열", 3.51, 3.59],
  ["글로벌융합계열", 3.85, 4.03],
  ["신학·인문융합계열", 4.0, 4.0],
  ["AI·SW계열", 3.92, 3.96],
];

const HANSIN_GYOKWA_CHAMINJAE: ExtraUnivRow[] = [
  ["사회복지학", 4.13, 4.0],
  ["신학", 4.18, 4.39],
  ["경영계열", 3.56, 4.15],
  ["자유전공학부", 4.5, 4.48],
  ["경제금융학", 4.2, 4.75],
  ["AI시스템반도체학", 5.0, 4.56],
  ["미디어융합기독교교육", 5.33, 6.02],
  ["금융공학", 4.84, 4.62],
  ["국제관계학", 4.02, 5.84],
  ["동아시아문화학", 3.69, 4.93],
  ["미디어계열", 3.71, 4.25],
  ["중국어문화콘텐츠학", 4.4, 4.31],
  ["한국사학", 4.98, 2.83],
  ["한국어문학", 5.63, 4.59],
  ["문예창작학", 4.38, 4.34],
  ["영미문화학", 4.1, 4.64],
  ["독일어문화학", 5.63, 5.05],
  ["철학", 4.35, 3.1],
  ["심리·아동학", 4.83, 4.65],
  ["AI·SW계열", 4.74, 5.0],
  ["재활상담학", 3.77, 4.69],
  ["사회학", 4.31, 4.39],
  ["공공인재빅데이터융합학", 5.49, 5.05],
  ["일본학", 5.0, 4.91],
  ["디지털영상문화콘텐츠학", 3.82, 4.36],
  ["빅데이터융합학", 4.71, 5.75],
];

const HANSIN_GYOKWA_SCHOOL_RECOMMEND: ExtraUnivRow[] = [
  ["경영계열", 3.05, 3.05],
  ["문화콘텐츠계열", 3.45, 3.46],
  ["첨단융합계열", 3.88, 4.03],
  ["미디어계열", 3.13, 3.13],
  ["휴먼서비스계열", 3.42, 3.48],
  ["글로벌융합계열", 3.45, 3.62],
  ["신학·인문융합계열", 3.69, 3.71],
  ["AI·SW계열", 3.52, 3.64],
];

const HANSIN_GYOKWA_GO른기회: ExtraUnivRow[] = [
  ["경영계열", 4.91, 4.91],
  ["첨단융합계열", 4.28, 4.7],
  ["미디어계열", 3.89, 3.89],
  ["문화콘텐츠계열", 3.7, 3.98],
  ["신학·인문융합계열", 4.19, 4.47],
  ["휴먼서비스계열", 3.6, 3.73],
  ["글로벌융합계열", 4.23, 4.49],
  ["AI·SW계열", 4.5, 4.52],
];

const HANSIN_GYOKWA_STUDENT_EXCELLENCE: ExtraUnivRow[] = [
  ["글로벌융합계열", 3.49, 3.56],
  ["경영계열", 3.37, 3.7],
  ["자유전공학부", 3.09, 3.32],
  ["AI시스템반도체학", 3.53, 4.45],
  ["문화콘텐츠계열", 3.4, 3.51],
  ["첨단융합계열", 3.71, 3.82],
  ["미디어계열", 2.95, 3.15],
  ["휴먼서비스계열", 3.38, 3.54],
  ["신학·인문융합계열", 3.59, 3.83],
  ["AI·SW계열", 3.61, 3.83],
];

const HANSIN_GYOKWA_OPPORTUNITY_BALANCE: ExtraUnivRow[] = [
  ["사회복지학", 3.82, 3.82],
  ["경영계열", 4.84, 4.84],
  ["미디어계열", 3.45, 3.48],
  ["심리·아동학", 3.76, 3.76],
  ["디지털영상문화콘텐츠학", 3.02, 3.02],
  ["AI·SW계열", 4.77, 4.95],
  ["재활상담학", 4.71, 4.71],
];

const HANSIN_GYOKWA_SPECIALIZED_HIGH_SCHOOL: ExtraUnivRow[] = [
  ["경영계열", 3.91, 4.49],
  ["미디어계열", 5.18, 5.18],
  ["디지털영상문화콘텐츠학", 4.38, 4.38],
  ["AI·SW계열", 2.69, 3.12],
];

const HANSIN_DEPARTMENTS = mergeExtraUnivDepartments(
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_NONGEOCHON,
    "hansin-nongeochon",
    "학생부교과 (농어촌학생)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_SPECIAL_EDUCATION,
    "hansin-special-education",
    "학생부교과 (특수교육)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_SOCIETY_SUPPORT,
    "hansin-society-support",
    "학생부교과 (사회배려자)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_CHAMINJAE,
    "hansin-chaminjae",
    "학생부교과 (참인재) (면접)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_SCHOOL_RECOMMEND,
    "hansin-school-recommend",
    "학생부교과 (학교장추천)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_GO른기회,
    "hansin-go른기회",
    "학생부교과 (고른기회)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_STUDENT_EXCELLENCE,
    "hansin-student-excellence",
    "학생부교과 (학생부우수자)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_OPPORTUNITY_BALANCE,
    "hansin-opportunity-balance",
    "학생부교과 (기회균형선발)",
    "교과",
    "한신대학교"
  ),
  makeExtraUnivDepartments(
    HANSIN_GYOKWA_SPECIALIZED_HIGH_SCHOOL,
    "hansin-specialized-high-school",
    "학생부교과 (특성화고교졸업자)",
    "교과",
    "한신대학교"
  )
);

// ==========================================
// 가천대학교 2026학년도 수시 입시결과
// 출처: 사용자가 제공한 2026학년도 수시 입시결과 엑셀
// 가천바람개비 = 학생부종합, 지역균형/학생부우수자 = 학생부교과
// 지역균형은 70% 컷을 사용하므로 secondCutPercent를 70으로 설정
// ==========================================
const GACHEON_DEPARTMENTS: Department[] = [
  {
    id: "gacheon-dept-1",
    name: "경영학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-1-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.6,
          finalPass75CutGrade: 3.9,
        },
      },
      {
        id: "gacheon-1-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.46,
          finalPass75CutGrade: 2.52,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-2",
    name: "회계세무학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-2-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.52,
          finalPass75CutGrade: 3.53,
        },
      },
      {
        id: "gacheon-2-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.67,
          finalPass75CutGrade: 2.67,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-3",
    name: "관광경영학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-3-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.66,
          finalPass75CutGrade: 3.76,
        },
      },
      {
        id: "gacheon-3-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.94,
          finalPass75CutGrade: 3.04,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-4",
    name: "의료산업경영학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-4-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.85,
          finalPass75CutGrade: 3.87,
        },
      },
      {
        id: "gacheon-4-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.56,
          finalPass75CutGrade: 2.74,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-5",
    name: "금융·빅데이터학부",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-5-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.37,
          finalPass75CutGrade: 3.51,
        },
      },
      {
        id: "gacheon-5-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.88,
          finalPass75CutGrade: 2.96,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-6",
    name: "경제학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-6-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.51,
          finalPass75CutGrade: 3.83,
        },
      },
      {
        id: "gacheon-6-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.76,
          finalPass75CutGrade: 2.8,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-7",
    name: "응용통계학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-7-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.51,
          finalPass75CutGrade: 3.55,
        },
      },
      {
        id: "gacheon-7-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.77,
          finalPass75CutGrade: 2.85,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-8",
    name: "심리학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-8-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.18,
          finalPass75CutGrade: 3.28,
        },
      },
      {
        id: "gacheon-8-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.35,
          finalPass75CutGrade: 2.39,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-9",
    name: "미디어커뮤니케이션학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-9-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.54,
          finalPass75CutGrade: 3.86,
        },
      },
      {
        id: "gacheon-9-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2,
          finalPass75CutGrade: 2.66,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-10",
    name: "사회복지학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-10-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.06,
          finalPass75CutGrade: 4.14,
        },
      },
      {
        id: "gacheon-10-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.88,
          finalPass75CutGrade: 2.94,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-11",
    name: "유아교육학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-11-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.51,
          finalPass75CutGrade: 3.79,
        },
      },
      {
        id: "gacheon-11-region",
        name: "지역균형",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.13,
          finalPass75CutGrade: 3.65,
        },
      },
      {
        id: "gacheon-11-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.09,
          finalPass75CutGrade: 3.15,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-12",
    name: "패션산업학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-12-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.79,
          finalPass75CutGrade: 3.9,
        },
      },
      {
        id: "gacheon-12-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.66,
          finalPass75CutGrade: 2.75,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-13",
    name: "AI인문대학",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-13-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.78,
          finalPass75CutGrade: 3.95,
        },
      },
      {
        id: "gacheon-13-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.87,
          finalPass75CutGrade: 2.9,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-14",
    name: "법과대학",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-14-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.56,
          finalPass75CutGrade: 3.64,
        },
      },
      {
        id: "gacheon-14-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.67,
          finalPass75CutGrade: 2.8,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-15",
    name: "도시계획·조경학부",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-15-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.03,
          finalPass75CutGrade: 4.15,
        },
      },
      {
        id: "gacheon-15-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.91,
          finalPass75CutGrade: 2.95,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-16",
    name: "건축학부",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-16-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.55,
          finalPass75CutGrade: 3.94,
        },
      },
      {
        id: "gacheon-16-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.72,
          finalPass75CutGrade: 2.81,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-17",
    name: "건축공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-17-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.61,
          finalPass75CutGrade: 3.92,
        },
      },
      {
        id: "gacheon-17-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.07,
          finalPass75CutGrade: 3.17,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-18",
    name: "화공생명배터리공학부",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-18-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.66,
          finalPass75CutGrade: 3.86,
        },
      },
      {
        id: "gacheon-18-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.64,
          finalPass75CutGrade: 2.73,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-19",
    name: "기계공학부",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-19-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.62,
          finalPass75CutGrade: 3.95,
        },
      },
      {
        id: "gacheon-19-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.73,
          finalPass75CutGrade: 2.79,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-20",
    name: "건설환경공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-20-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.63,
          finalPass75CutGrade: 3.78,
        },
      },
      {
        id: "gacheon-20-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.81,
          finalPass75CutGrade: 2.86,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-21",
    name: "스마트팩토리학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-21-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.04,
          finalPass75CutGrade: 4.06,
        },
      },
      {
        id: "gacheon-21-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.92,
          finalPass75CutGrade: 2.96,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-22",
    name: "신소재공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-22-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.18,
          finalPass75CutGrade: 3.54,
        },
      },
      {
        id: "gacheon-22-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.81,
          finalPass75CutGrade: 2.92,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-23",
    name: "식품생명공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-23-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.24,
          finalPass75CutGrade: 3.56,
        },
      },
      {
        id: "gacheon-23-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.62,
          finalPass75CutGrade: 2.7,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-24",
    name: "바이오나노학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-24-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.01,
          finalPass75CutGrade: 3.15,
        },
      },
      {
        id: "gacheon-24-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.68,
          finalPass75CutGrade: 2.81,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-25",
    name: "생명과학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-25-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.85,
          finalPass75CutGrade: 3.71,
        },
      },
      {
        id: "gacheon-25-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.38,
          finalPass75CutGrade: 2.78,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-26",
    name: "반도체물리학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-26-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.31,
          finalPass75CutGrade: 4.34,
        },
      },
      {
        id: "gacheon-26-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.76,
          finalPass75CutGrade: 2.92,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-27",
    name: "화학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-27-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.65,
          finalPass75CutGrade: 3.67,
        },
      },
      {
        id: "gacheon-27-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.65,
          finalPass75CutGrade: 2.69,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-28",
    name: "식품영양학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-28-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.62,
          finalPass75CutGrade: 3.86,
        },
      },
      {
        id: "gacheon-28-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.7,
          finalPass75CutGrade: 2.75,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-29",
    name: "전기공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-29-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.37,
          finalPass75CutGrade: 3.45,
        },
      },
      {
        id: "gacheon-29-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.96,
          finalPass75CutGrade: 3,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-30",
    name: "스마트시티학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-30-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.17,
          finalPass75CutGrade: 4.23,
        },
      },
      {
        id: "gacheon-30-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.89,
          finalPass75CutGrade: 2.98,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-31",
    name: "클라우드공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-31-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.38,
          finalPass75CutGrade: 3.42,
        },
      },
      {
        id: "gacheon-31-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.44,
          finalPass75CutGrade: 2.54,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-32",
    name: "컴퓨터공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-32-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.33,
          finalPass75CutGrade: 3.46,
        },
      },
      {
        id: "gacheon-32-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.6,
          finalPass75CutGrade: 2.64,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-33",
    name: "(2026:정보보호학과) 스마트보안학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-33-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.9,
          finalPass75CutGrade: 4.05,
        },
      },
      {
        id: "gacheon-33-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.87,
          finalPass75CutGrade: 3.16,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-34",
    name: "인공지능학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-34-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.62,
          finalPass75CutGrade: 3.74,
        },
      },
      {
        id: "gacheon-34-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.72,
          finalPass75CutGrade: 2.8,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-35",
    name: "의공학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-35-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.51,
          finalPass75CutGrade: 3.61,
        },
      },
      {
        id: "gacheon-35-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.82,
          finalPass75CutGrade: 2.88,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-36",
    name: "운동재활학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-36-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.71,
          finalPass75CutGrade: 3.92,
        },
      },
      {
        id: "gacheon-36-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.87,
          finalPass75CutGrade: 3.17,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-37",
    name: "바이오로직스학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-37-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.19,
          finalPass75CutGrade: 3.33,
        },
      },
      {
        id: "gacheon-37-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.66,
          finalPass75CutGrade: 2.68,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-38",
    name: "간호학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-38-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.79,
          finalPass75CutGrade: 2.88,
        },
      },
      {
        id: "gacheon-38-region",
        name: "지역균형",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.3,
          finalPass75CutGrade: 2.32,
        },
      },
      {
        id: "gacheon-38-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 1.89,
          finalPass75CutGrade: 1.99,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-39",
    name: "치위생학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-39-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.3,
          finalPass75CutGrade: 3.67,
        },
      },
      {
        id: "gacheon-39-region",
        name: "지역균형",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.17,
          finalPass75CutGrade: 3.48,
        },
      },
      {
        id: "gacheon-39-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.81,
          finalPass75CutGrade: 2.86,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-40",
    name: "응급구조학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-40-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.13,
          finalPass75CutGrade: 4.64,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-41",
    name: "방사선학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-41-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.05,
          finalPass75CutGrade: 3.05,
        },
      },
      {
        id: "gacheon-41-region",
        name: "지역균형",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.52,
          finalPass75CutGrade: 2.65,
        },
      },
      {
        id: "gacheon-41-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 1.78,
          finalPass75CutGrade: 1.96,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-42",
    name: "물리치료학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-42-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.31,
          finalPass75CutGrade: 3.48,
        },
      },
      {
        id: "gacheon-42-region",
        name: "지역균형",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.17,
          finalPass75CutGrade: 2.41,
        },
      },
      {
        id: "gacheon-42-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 1.98,
          finalPass75CutGrade: 2.3,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-43",
    name: "반도체대학",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-43-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.39,
          finalPass75CutGrade: 3.55,
        },
      },
      {
        id: "gacheon-43-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.64,
          finalPass75CutGrade: 2.82,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-44",
    name: "시스템반도체학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-44-baram",
        name: "가천바람개비",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.44,
          finalPass75CutGrade: 3.56,
        },
      },
      {
        id: "gacheon-44-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.99,
          finalPass75CutGrade: 3.01,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-45",
    name: "한의예과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-45-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 1.11,
          finalPass75CutGrade: 1.15,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-46",
    name: "약학과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-46-student",
        name: "학생부우수자",
        category: "교과",
        // 50%/70% 컷 원자료가 없어 해당 전형은 컷 비교를 제공하지 않습니다.
        cutoffs: undefined,
      },
    ],
  },
  {
    id: "gacheon-dept-47",
    name: "의예과",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-47-student",
        name: "학생부우수자",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 1,
          finalPass75CutGrade: 1.04,
        },
      },
    ],
  },
  {
    id: "gacheon-dept-48",
    name: "자유전공",
    college: "가천대학교",
    admissions: [
      {
        id: "gacheon-48-region",
        name: "지역균형",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.01,
          finalPass75CutGrade: 3.18,
        },
      },
    ],
  },
];

// ==========================================
// 강남대학교 2026학년도 수시 입시결과
// 출처: 사용자가 제공한 대입정보포털(adiga) PDF
// 교과: 학생부교과(지역균형전형), 기회균형(원자료 표기: 학생부교과(기초생활수급자전형)) / 종합: 학생부종합(학교생활우수자전형1)
// 두 번째 컷은 원자료의 70% 컷이므로 secondCutPercent=70
// ==========================================
const GANGNAM_DEPARTMENTS: Department[] = [
  {
    id: "gangnam-dept-1",
    name: "인공지능융합공학부",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-1-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.12,
          finalPass75CutGrade: 3.18,
        },
      },
      {
        id: "gangnam-1-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.71,
          finalPass75CutGrade: 3.88,
        },
      },
      {
        id: "gangnam-1-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.28,
          finalPass75CutGrade: 4.36,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-2",
    name: "글로벌문화콘텐츠대학",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-2-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.73,
          finalPass75CutGrade: 2.77,
        },
      },
      {
        id: "gangnam-2-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.8,
          finalPass75CutGrade: 3.97,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-3",
    name: "법행정세무학부(야)",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-3-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.13,
          finalPass75CutGrade: 3.18,
        },
      },
      {
        id: "gangnam-3-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 5.02,
          finalPass75CutGrade: 5.16,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-4",
    name: "법행정세무학부",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-4-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.03,
          finalPass75CutGrade: 3.05,
        },
      },
      {
        id: "gangnam-4-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.72,
          finalPass75CutGrade: 3.25,
        },
      },
      {
        id: "gangnam-4-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.9,
          finalPass75CutGrade: 4.15,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-5",
    name: "복지융합대학",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-5-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.76,
          finalPass75CutGrade: 2.89,
        },
      },
      {
        id: "gangnam-5-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.95,
          finalPass75CutGrade: 3.11,
        },
      },
      {
        id: "gangnam-5-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.94,
          finalPass75CutGrade: 4.05,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-6",
    name: "부동산건설학부",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-6-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.05,
          finalPass75CutGrade: 3.23,
        },
      },
      {
        id: "gangnam-6-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.69,
          finalPass75CutGrade: 3.86,
        },
      },
      {
        id: "gangnam-6-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.4,
          finalPass75CutGrade: 4.78,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-7",
    name: "자유전공학부",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-7-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.86,
          finalPass75CutGrade: 2.86,
        },
      },
      {
        id: "gangnam-7-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.84,
          finalPass75CutGrade: 3.31,
        },
      },
      {
        id: "gangnam-7-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.01,
          finalPass75CutGrade: 4.15,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-8",
    name: "사회복지학부(야)",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-8-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.26,
          finalPass75CutGrade: 3.27,
        },
      },
      {
        id: "gangnam-8-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.8,
          finalPass75CutGrade: 5.04,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-9",
    name: "상경학부",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-9-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.81,
          finalPass75CutGrade: 2.85,
        },
      },
      {
        id: "gangnam-9-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 2.87,
          finalPass75CutGrade: 3.32,
        },
      },
      {
        id: "gangnam-9-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.02,
          finalPass75CutGrade: 4.17,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-10",
    name: "상경학부(야)",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-10-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.23,
          finalPass75CutGrade: 3.33,
        },
      },
      {
        id: "gangnam-10-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 5.0,
          finalPass75CutGrade: 5.24,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-11",
    name: "컴퓨터공학부",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-11-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.06,
          finalPass75CutGrade: 3.13,
        },
      },
      {
        id: "gangnam-11-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.16,
          finalPass75CutGrade: 3.26,
        },
      },
      {
        id: "gangnam-11-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.14,
          finalPass75CutGrade: 4.27,
        },
      },
    ],
  },
  {
    id: "gangnam-dept-12",
    name: "전자반도체공학부",
    college: "강남대학교",
    admissions: [
      {
        id: "gangnam-12-gyokwa",
        name: "학생부교과(지역균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.05,
          finalPass75CutGrade: 3.06,
        },
      },
      {
        id: "gangnam-12-gibun",
        name: "학생부교과(기회균형전형)",
        category: "교과",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 3.48,
          finalPass75CutGrade: 3.89,
        },
      },
      {
        id: "gangnam-12-jonghap",
        name: "학생부종합(학교생활우수자전형1)",
        category: "종합",
        cutoffs: {
          secondCutPercent: 70,
          finalPass50CutGrade: 4.04,
          finalPass75CutGrade: 4.16,
        },
      },
    ],
  },
];

const INITIAL_UNIVERSITY_DATABASE: UniversityData[] = [
  {
    id: "gacheon",
    name: "가천대학교",
    campus: "글로벌",
    departments: GACHEON_DEPARTMENTS,
  },
  {
    id: "gangnam",
    name: "강남대학교",
    campus: "용인",
    departments: GANGNAM_DEPARTMENTS,
  },
  {
    id: "kangwon-gn",
    name: "강원대학교",
    campus: "강릉",
    departments: KANGWON_DEPARTMENTS,
  },
  {
    id: "kangwon-wj",
    name: "강원대학교",
    campus: "원주",
    departments: WONJU_DEPARTMENTS,
  },
  {
    id: "kangwon-ch",
    name: "강원대학교",
    campus: "춘천",
    departments: CHUNCHEON_DEPARTMENTS,
  },
  {
    id: "kangwon-sd",
    name: "강원대학교",
    campus: "삼척/도계",
    departments: SAMCHEOK_DOGYE_DEPARTMENTS,
  },
  {
    id: "dankook-jukjeon",
    name: "단국대학교",
    campus: "죽전",
    departments: DANKOOK_JUKJEON_DEPARTMENTS,
  },
  {
    id: "dankook-cheonan",
    name: "단국대학교",
    campus: "천안",
    departments: DANKOOK_CHEONAN_DEPARTMENTS,
  },
  {
    id: "soongsil",
    name: "숭실대학교",
    campus: "서울",
    departments: SOONGSIL_DEPARTMENTS,
  },
  {
    id: "sungkyul",
    name: "성결대학교",
    campus: "안양",
    departments: SUNGKYUL_DEPARTMENTS,
  },
  {
    id: "hansin",
    name: "한신대학교",
    campus: "오산",
    departments: HANSIN_DEPARTMENTS,
  },
];

// ==========================================
// 3. 일반 성적 분석 로직
// ==========================================
function getSubjectCategory(group: string): string {
  const g = group.replace(/\s+/g, "");
  if (g.includes("국어")) return "국어";
  if (g.includes("수학")) return "수학";
  if (g.includes("영어")) return "영어";
  if (g.includes("한국사") || g.includes("국사")) return "사회";
  if (g.includes("사회") || g.includes("역사") || g.includes("도덕"))
    return "사회";
  if (g.includes("과학")) return "과학";
  return "기타";
}

export function filterSubjectsByCombination(
  records: GradeRecord[],
  combination: AnalysisSettings["subjectCombination"]
): GradeRecord[] {
  if (combination === "전교과") return records;
  const targetCategories = new Set<string>();
  if (combination.includes("국")) targetCategories.add("국어");
  if (combination.includes("영")) targetCategories.add("영어");
  if (combination.includes("수")) targetCategories.add("수학");
  if (combination.includes("사")) targetCategories.add("사회");
  if (combination.includes("과")) targetCategories.add("과학");
  return records.filter((r) =>
    targetCategories.has(getSubjectCategory(r.subjectGroup))
  );
}

function calculateAverageForRecords(
  records: GradeRecord[],
  useCredits: boolean
): number | null {
  const validRecords = records.filter(
    (r) =>
      r.rankGrade !== null &&
      (!useCredits || (r.credits !== null && r.credits > 0))
  );
  if (validRecords.length === 0) return null;

  if (useCredits) {
    let totalScore = 0;
    let totalCredits = 0;
    validRecords.forEach((r) => {
      totalScore += r.rankGrade! * r.credits!;
      totalCredits += r.credits!;
    });
    return totalCredits > 0 ? totalScore / totalCredits : null;
  } else {
    let totalScore = 0;
    validRecords.forEach((r) => {
      totalScore += r.rankGrade!;
    });
    return totalScore / validRecords.length;
  }
}

export function calculateAnalysis(
  records: GradeRecord[],
  settings: AnalysisSettings
): AnalysisResult {
  const combinationRecords = filterSubjectsByCombination(
    records,
    settings.subjectCombination
  );
  const validRecords = combinationRecords.filter((r) => r.rankGrade !== null);
  const excludedSubjectCount = combinationRecords.length - validRecords.length;
  const validSubjectCount = validRecords.length;
  const validCreditsCount = validRecords.reduce(
    (sum, r) => sum + (r.credits || 0),
    0
  );

  const grade1Avg = calculateAverageForRecords(
    validRecords.filter((r) => r.grade === 1),
    settings.useCredits
  );
  const grade2Avg = calculateAverageForRecords(
    validRecords.filter((r) => r.grade === 2),
    settings.useCredits
  );
  const grade3Avg = calculateAverageForRecords(
    validRecords.filter((r) => r.grade === 3),
    settings.useCredits
  );

  let overallAverage: number | null = null;
  if (
    settings.weightType === "100" ||
    (grade1Avg === null && grade2Avg === null && grade3Avg === null)
  ) {
    overallAverage = calculateAverageForRecords(
      validRecords,
      settings.useCredits
    );
  } else {
    const w1 = settings.customWeights.g1;
    const w2 = settings.customWeights.g2;
    const w3 = settings.customWeights.g3;

    let val = 0;
    let weightSum = 0;

    if (grade1Avg !== null) {
      val += grade1Avg * w1;
      weightSum += w1;
    }
    if (grade2Avg !== null) {
      val += grade2Avg * w2;
      weightSum += w2;
    }
    if (grade3Avg !== null) {
      val += grade3Avg * w3;
      weightSum += w3;
    }

    if (weightSum > 0) overallAverage = val / weightSum;
    else
      overallAverage = calculateAverageForRecords(
        validRecords,
        settings.useCredits
      );
  }

  return {
    overallAverage,
    grade1Average: grade1Avg,
    grade2Average: grade2Avg,
    grade3Average: grade3Avg,
    validSubjectCount,
    validCreditsCount,
    excludedSubjectCount,
  };
}

// ==========================================
// 4. HTML 파서
// ==========================================
function findGradeFromDOM(tableElement: HTMLTableElement): 1 | 2 | 3 | null {
  if (typeof window === "undefined") return null;
  let current: HTMLElement | null = tableElement;
  while (current && current !== document.body) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      const match = (sibling.textContent || "").match(/([1-3])\s*학년/);
      if (match) return parseInt(match[1]) as 1 | 2 | 3;
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }
  return null;
}

function parseNeisHtml(html: string) {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const tables = doc.querySelectorAll("table");
  const records: GradeRecord[] = [];
  const processedRows = new Set<HTMLTableRowElement>();

  tables.forEach((table) => {
    const thElements = table.querySelectorAll("thead th");
    if (thElements.length === 0) return;

    const headers = Array.from(thElements).map((th) =>
      (th.getAttribute("title") || th.textContent || "").replace(/\s+/g, "")
    );
    const headerString = headers.join("|");

    let baseTableType: "regular" | "career" | "arts_pe" | null = null;
    if (headerString.includes("석차등급")) baseTableType = "regular";
    else if (headerString.includes("성취도별분포비율"))
      baseTableType = "career";
    else if (
      headerString.includes("성취도") &&
      !headerString.includes("원점수")
    )
      baseTableType = "arts_pe";

    if (!baseTableType) return;

    const grade = findGradeFromDOM(table) || 1;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    let rowspanBuffer: { text: string; span: number }[] = [];

    Array.from(tbody.rows).forEach((tr) => {
      if (processedRows.has(tr)) return;
      processedRows.add(tr);

      let colValues: string[] = [];
      let tdIndex = 0;
      let colIndex = 0;

      while (colIndex < 10) {
        if (rowspanBuffer[colIndex] && rowspanBuffer[colIndex].span > 0) {
          colValues.push(rowspanBuffer[colIndex].text);
          rowspanBuffer[colIndex].span--;
          colIndex++;
        } else {
          const cell = tr.cells[tdIndex];
          if (!cell) break;
          const text = cell.textContent?.trim() || "";
          colValues.push(text);
          if (cell.rowSpan > 1)
            rowspanBuffer[colIndex] = { text, span: cell.rowSpan - 1 };
          tdIndex++;
          colIndex++;
        }
      }

      const semester = colValues[0]?.includes("2") ? 2 : 1;
      const subjectGroup = colValues[1] || "";
      const subject = colValues[2] || "";
      const credits = parseFloat(colValues[3]) || null;
      if (!subject) return;

      let tableType: "regular" | "career" | "arts_pe" | "other" =
        baseTableType!;
      if (subject.includes("진로와 직업")) tableType = "other";

      let rankGrade = null;
      let achievement = null;

      if (tableType === "regular") {
        rankGrade = parseFloat(colValues[6]) || null;
      } else if (tableType === "career" || tableType === "arts_pe") {
        const achVMatch = colValues[5]?.match(/([A-E])\s*\(\s*(\d+)\s*\)/);
        if (achVMatch) achievement = achVMatch[1];
        else achievement = colValues[5]?.charAt(0) || null;
      }

      records.push({
        id: Math.random().toString(36).slice(2, 11),
        grade,
        semester,
        tableType,
        subjectGroup,
        subject,
        credits,
        rawScore: null,
        average: null,
        stdDev: null,
        studentCount: null,
        achievement,
        achievementRatio: null,
        rankGrade,
      });
    });
  });
  return records;
}

// ==========================================
// 5. 메인 앱 컴포넌트
// ==========================================
type Step =
  | "home"
  | "input-method"
  | "upload"
  | "manual-simple"
  | "manual-detailed"
  | "preview"
  | "analysis-result"
  | "select-university"
  | "bio-assessment"
  | "bio-result";

function AnimatedProbabilityBar({
  chance,
  barColor,
  animationKey,
}: {
  chance: number;
  barColor: string;
  animationKey: string;
}) {
  const target = Math.max(1, Math.min(100, Math.round(Number(chance) || 1)));

  // 중요: SVG/WAAPI/requestAnimationFrame을 모두 사용하지 않고
  // 일반 HTML div + CSS keyframes만 사용합니다.
  // animationKey가 바뀌면 컴포넌트가 완전히 새로 마운트되어
  // 모든 판정 단계에서 동일하게 1% -> 100% -> 최종확률을 재생합니다.
  return (
    <>
      <style>{`.bio-disclaimer-confirm { background: #ede9fe !important; color: #4c1d95 !important; -webkit-text-fill-color: #4c1d95 !important; opacity: 1 !important; border: 2px solid #8b5cf6 !important; } .bio-disclaimer-confirm span { color: #4c1d95 !important; -webkit-text-fill-color: #4c1d95 !important; opacity: 1 !important; } .bio-disclaimer-confirm:disabled { background: #e2e8f0 !important; color: #334155 !important; -webkit-text-fill-color: #334155 !important; border-color: #cbd5e1 !important; opacity: 1 !important; } .bio-disclaimer-confirm:disabled span { color: #334155 !important; -webkit-text-fill-color: #334155 !important; }
        .force-white-button { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
        button.bg-indigo-600, button.bg-violet-600, button.bg-teal-600, button.bg-blue-600 { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
        select, select option { color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; background-color: #ffffff !important; }
        @keyframes admissionProbabilitySweep {
          0%   { width: 1%; }
          38%  { width: 100%; }
          52%  { width: 100%; }
          100% { width: var(--probability-target); }
        }
      `}</style>
      <div
        key={animationKey}
        className="w-full rounded-full h-3 overflow-hidden p-0.5"
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div
          className={`h-full rounded-full ${barColor}`}
          style={
            {
              width: "1%",
              // @ts-ignore CSS custom property
              "--probability-target": `${target}%`,
              animation:
                "admissionProbabilitySweep 2.6s cubic-bezier(0.22, 1, 0.36, 1) both",
              willChange: "width",
            } as React.CSSProperties
          }
          aria-label={`예상 합격 확률 ${target}%`}
        />
      </div>
    </>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>("home");
  const [mode, setMode] = useState<"analyze" | "predict" | null>(null);

  // 면책 문구 동의 관련 상태
  const [showDisclaimerModal, setShowDisclaimerModal] =
    useState<boolean>(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState<boolean>(false);

  // 생기부 분석 별도 안내/동의 상태
  const [showBioDisclaimerModal, setShowBioDisclaimerModal] =
    useState<boolean>(false);
  const [bioDisclaimerChecked, setBioDisclaimerChecked] =
    useState<boolean>(false);
  const [bioAnalyzedTargetKey, setBioAnalyzedTargetKey] = useState<
    string | null
  >(null);
  const [pendingPredictAction, setPendingPredictAction] = useState<
    (() => void) | null
  >(null);

  // 동적 대학 DB (직접 입력 추가 가능)
  const [univDatabase, setUnivDatabase] = useState<UniversityData[]>(
    INITIAL_UNIVERSITY_DATABASE
  );

  // 데이터 상태
  const [records, setRecords] = useState<GradeRecord[]>([]);
  // 생기부 원문: 나이스 HTML 전체 텍스트를 보존하여 교과성적 외 출결/활동까지 규칙 기반 분석에 사용
  const [recordBookHtml, setRecordBookHtml] = useState<string>("");
  const [bioWeights, setBioWeights] = useState({
    academic: 40,
    career: 40,
    community: 20,
  });
  // 심층 생기부 분석 셀프 평가: 실제 대학 등급이 아니라 사용자가 입력하는 참고 등급입니다.
  const BIO_GRADE_OPTIONS = [
    "A+",
    "A0",
    "A-",
    "B+",
    "B0",
    "B-",
    "C+",
    "C0",
    "C-",
    "D+",
    "D0",
    "D-",
    "E",
  ] as const;
  type BioGrade = (typeof BIO_GRADE_OPTIONS)[number];
  const BIO_GRADE_SCORE: Record<BioGrade, number> = {
    "A+": 100,
    A0: 95,
    "A-": 90,
    "B+": 85,
    B0: 80,
    "B-": 75,
    "C+": 70,
    C0: 65,
    "C-": 60,
    "D+": 50,
    D0: 40,
    "D-": 30,
    E: 10,
  };
  const scoreToBioGrade = (score: number): BioGrade => {
    let best: BioGrade = "E",
      distance = Infinity;
    BIO_GRADE_OPTIONS.forEach((grade) => {
      const d = Math.abs(BIO_GRADE_SCORE[grade] - score);
      if (d < distance) {
        best = grade;
        distance = d;
      }
    });
    return best;
  };
  const [bioRatings, setBioRatings] = useState<{
    academic: BioGrade | null;
    career: BioGrade | null;
    community: BioGrade | null;
  }>({ academic: null, career: null, community: null });
  const [simpleGrade, setSimpleGrade] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 대학 선택 상태
  const [selectedUnivId, setSelectedUnivId] = useState<string>("kangwon-gn");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>("");

  // 수동 사용자 대학 등록 모드 폼 상태
  const [showAddUnivModal, setShowAddUnivModal] = useState<boolean>(false);
  const [customUnivInput, setCustomUnivInput] = useState({
    univName: "",
    campus: "본교",
    deptName: "",
    admissionName: "학생부교과 (일반)",
    category: "교과" as "교과" | "종합",
    cut50: "",
    cut75: "",
  });

  // 대교협 점수(입력란용)
  const [adigaGrade, setAdigaGrade] = useState<string>("");

  const selectedUniv =
    univDatabase.find((u) => u.id === selectedUnivId) || univDatabase[0];
  const selectedDept = selectedUniv?.departments.find(
    (d) => d.id === selectedDeptId
  );
  const selectedAdmission = selectedDept?.admissions.find(
    (a) => a.id === selectedAdmissionId
  );

  // 전교과 평균 내신 자동 계산
  const allSubjectAvg = useMemo(() => {
    if (simpleGrade !== null) return simpleGrade;
    if (records.length > 0) {
      const basicResult = calculateAnalysis(records, {
        subjectCombination: "전교과",
        useCredits: true,
        weightType: "100",
        customWeights: { g1: 33, g2: 33, g3: 34 },
      });
      return basicResult.overallAverage;
    }
    return null;
  }, [simpleGrade, records]);

  // AI 합격예측 서비스 진입 시 면책 문구 트리거
  const handleStartPredict = (action: () => void) => {
    setPendingPredictAction(() => action);
    setDisclaimerChecked(false);
    setShowDisclaimerModal(true);
  };

  const handleConfirmDisclaimer = () => {
    if (!disclaimerChecked) return;
    setShowDisclaimerModal(false);
    if (pendingPredictAction) {
      pendingPredictAction();
      setPendingPredictAction(null);
    }
  };

  const handleStartBioAnalysis = () => {
    if (
      !recordBookHtml ||
      !selectedDept ||
      selectedAdmission?.category !== "종합"
    )
      return;
    setBioDisclaimerChecked(false);
    setShowBioDisclaimerModal(true);
  };

  const handleConfirmBioDisclaimer = () => {
    if (!bioDisclaimerChecked) return;
    setShowBioDisclaimerModal(false);
    setBioRatings({ academic: null, career: null, community: null });
    setStep("bio-assessment");
  };

  const handleRunDeepBioAnalysis = () => {
    if (
      !selectedDept ||
      selectedAdmission?.category !== "종합" ||
      !recordBookHtml
    )
      return;
    if (
      bioRatings.academic == null ||
      bioRatings.career == null ||
      bioRatings.community == null
    )
      return;
    if (bioWeights.academic + bioWeights.career + bioWeights.community !== 100)
      return;
    setBioAnalyzedTargetKey(
      `${selectedUnivId}|${selectedDeptId}|${selectedAdmissionId}`
    );
    setStep("bio-result");
  };

  // 뒤로가기 로직
  const goBack = () => {
    if (step === "input-method") setStep("home");
    else if (
      step === "upload" ||
      step === "manual-simple" ||
      step === "manual-detailed"
    )
      setStep("input-method");
    else if (step === "preview") setStep("upload");
    else if (step === "analysis-result") setStep("input-method");
    else if (step === "bio-result") setStep("bio-assessment");
    else if (step === "bio-assessment") setStep("select-university");
    else if (step === "select-university")
      setStep(mode === "analyze" ? "analysis-result" : "preview");
  };

  // 앱 초기화 함수
  const resetApp = () => {
    setStep("home");
    setMode(null);
    setRecords([]);
    setRecordBookHtml("");
    setBioWeights({ academic: 40, career: 40, community: 20 });
    setBioRatings({ academic: null, career: null, community: null });
    setSimpleGrade(null);
    setAdigaGrade("");
    setSelectedDeptId("");
    setSelectedAdmissionId("");
    setBioAnalyzedTargetKey(null);
  };

  // 1% 단위 정밀 합격 확률 계산
  // 등급은 숫자가 작을수록 우수합니다. 종합은 실제 엑셀에 제공된 최종등록자 ${secondCutPercent}%컷을 기준으로 합니다.
  const getPrediction = (
    userGrade: number,
    cutoffs?: CutoffData,
    category: "교과" | "종합" = "교과"
  ) => {
    const cut50 = cutoffs?.finalPass50CutGrade;
    const cut75 = cutoffs?.finalPass75CutGrade;
    const secondCutPercent = cutoffs?.secondCutPercent ?? 75;

    if (cut50 == null && cut75 == null) {
      return {
        text: "판단 불가 ❓",
        chance: 0,
        bg: "bg-slate-800 border-slate-700 text-slate-300",
        barColor: "bg-slate-500",
        msg: "비교 가능한 최종등록자 입결 컷이 없어 현재 성적의 상대적 위치를 산출하기 어렵습니다.",
        diffText: "-",
        diffLabel: "입결 컷 대비 등급 차이",
      };
    }

    const referenceCut =
      category === "종합" ? cut75 ?? cut50! : cut50 ?? cut75!;
    const diff = userGrade - referenceCut;

    const getOutcomeText = (chance: number) => {
      if (chance >= 75) return "최초합이 예상됩니다.";
      if (chance >= 60) return "충원 (앞) 합격이 예상됩니다.";
      if (chance >= 45) return "충원 (문닫) 합격이 예상됩니다.";
      if (chance >= 25) return "불합격 (예비) 이 예상됩니다.";
      return "불합격이 예상됩니다.";
    };

    const isInterviewAdmission =
      /참인재|SKU창의적인재/.test(selectedAdmission?.name ?? "") ||
      /면접/.test(selectedAdmission?.name ?? "");

    const getInterviewFlipText = (grade: number) => {
      if (!isInterviewAdmission || cut50 == null || cut75 == null) return null;
      const betterCut = Math.min(cut50, cut75);
      const weakerCut = Math.max(cut50, cut75);
      if (grade <= betterCut) {
        return "면접전형: 현재 교과 성적 경쟁력이 충분해 면접은 합격 가능성을 더 높이는 방향으로 작용할 수 있습니다.";
      }
      if (grade <= weakerCut) {
        return "면접전형: 50%컷~70%컷 구간으로, 면접 결과에 따라 합격 가능성을 충분히 끌어올릴 여지가 있습니다.";
      }
      const outsideGap = grade - weakerCut;
      if (outsideGap <= 0.3) {
        return "면접전형: 70%컷을 조금 넘어선 정도라 면접으로 충분히 뒤집을 가능성이 있습니다.";
      }
      if (outsideGap <= 0.7) {
        return "면접전형: 70%컷보다 불리하지만 면접 경쟁력이 매우 높다면 뒤집을 가능성이 있습니다.";
      }
      return "면접전형: 70%컷과의 격차가 커 면접만으로 결과를 뒤집을 가능성은 낮습니다.";
    };

    let chance = 1;

    // 면접전형은 70%컷 바로 바깥 구간을 우주상향으로 과도하게 분류하지 않습니다.
    // 등급 숫자가 클수록 불리하므로 70%컷보다 0~0.30등급 불리하면 소신,
    // 0.30~0.70등급 불리하면 상향, 그보다 더 멀어질 때만 우주상향으로 봅니다.
    if (isInterviewAdmission && cut50 != null && cut75 != null) {
      const betterCut = Math.min(cut50, cut75);
      const weakerCut = Math.max(cut50, cut75);
      const interviewDiff = userGrade - weakerCut;

      if (userGrade <= betterCut) {
        chance = 88;
        return {
          text: "안정 🟢",
          chance,
          bg: "bg-teal-950/60 border-teal-500/50 text-teal-300",
          barColor: "bg-teal-500",
          msg: "면접전형에서 전년도 50%컷보다도 경쟁력 있는 성적 구간입니다. 면접에서 특별한 감점 요인이 없다면 합격 가능성이 비교적 높은 편으로 판단합니다.",
          diffText: (userGrade - cut50).toFixed(2),
          diffLabel: "50% 컷 대비 등급 차이",
          outcomeText: getOutcomeText(chance),
          interviewFlipText: getInterviewFlipText(userGrade),
        };
      }

      if (userGrade <= weakerCut) {
        const ratio =
          (userGrade - betterCut) / Math.max(0.01, weakerCut - betterCut);
        chance = Math.round(78 - ratio * 18);
        return {
          text: ratio <= 0.5 ? "적정 ✅" : "소신 ✊",
          chance,
          bg:
            ratio <= 0.5
              ? "bg-blue-950/60 border-blue-500/50 text-blue-300"
              : "bg-amber-950/60 border-amber-500/50 text-amber-300",
          barColor: ratio <= 0.5 ? "bg-blue-500" : "bg-amber-500",
          msg:
            ratio <= 0.5
              ? "면접전형의 전년도 50%컷~70%컷 범위 안에 있어 교과성적 기준으로 적정한 구간입니다. 면접에서 좋은 평가를 받으면 합격 가능성을 더 높일 수 있습니다."
              : "면접전형의 70%컷에 가까운 구간으로, 교과성적만 보면 여유가 크지 않습니다. 다만 면접에서 경쟁력을 보여주면 충분히 합격을 노려볼 수 있습니다.",
          diffText: (userGrade - cut50).toFixed(2),
          diffLabel: "50% 컷 대비 등급 차이",
          outcomeText: getOutcomeText(chance),
          interviewFlipText: getInterviewFlipText(userGrade),
        };
      }

      if (interviewDiff <= 0.3) {
        chance = Math.round(45 - (interviewDiff / 0.3) * 12);
        return {
          text: "소신 ✊",
          chance,
          bg: "bg-amber-950/60 border-amber-500/50 text-amber-300",
          barColor: "bg-amber-500",
          msg: "70%컷을 조금 넘어선 구간이지만 아직 바로 우주상향으로 볼 정도의 격차는 아닙니다. 면접 반영이 있는 만큼 면접에서 좋은 평가를 받으면 합격 가능성을 끌어올릴 여지가 있습니다.",
          diffText: interviewDiff.toFixed(2),
          diffLabel: "70% 컷 대비 등급 차이",
          outcomeText: getOutcomeText(chance),
          interviewFlipText: getInterviewFlipText(userGrade),
        };
      }

      if (interviewDiff <= 0.7) {
        chance = Math.round(30 - ((interviewDiff - 0.3) / 0.4) * 15);
        return {
          text: "상향(도전) 🔼",
          chance,
          bg: "bg-orange-950/60 border-orange-500/50 text-orange-300",
          barColor: "bg-orange-500",
          msg: "70%컷보다 불리한 상향 지원 구간입니다. 통계적으로는 쉽지 않지만 면접 반영비율이 있는 만큼 면접 경쟁력이 매우 높다면 결과를 뒤집을 가능성이 있습니다.",
          diffText: interviewDiff.toFixed(2),
          diffLabel: "70% 컷 대비 등급 차이",
          outcomeText: getOutcomeText(chance),
          interviewFlipText: getInterviewFlipText(userGrade),
        };
      }

      chance = Math.max(1, Math.round(12 - (interviewDiff - 0.7) * 7));
      return {
        text: "우주상향 🚀",
        chance,
        bg: "bg-rose-950/60 border-rose-500/50 text-rose-300",
        barColor: "bg-rose-500",
        msg: "70%컷과도 상당한 성적 격차가 있는 고위험 지원입니다. 면접만으로 결과를 뒤집기는 쉽지 않으며, 경쟁률·충원 등 모집환경의 큰 변화까지 함께 필요할 수 있습니다.",
        diffText: interviewDiff.toFixed(2),
        diffLabel: "70% 컷 대비 등급 차이",
        outcomeText: getOutcomeText(chance),
        interviewFlipText: getInterviewFlipText(userGrade),
      };
    }

    // 교과전형은 50~70%컷 사이에서도 본인 등급의 위치에 따라 설명과 합격 가능성을 세분화합니다.
    // 등급 숫자가 작을수록 우수하므로 원자료의 컷 순서가 뒤집혀 있어도 구간은 정상화합니다.
    if (category === "교과" && cut50 != null && cut75 != null) {
      const betterCut = Math.min(cut50, cut75);
      const weakerCut = Math.max(cut50, cut75);
      if (userGrade >= betterCut && userGrade <= weakerCut) {
        const cutGap = Math.max(0.01, weakerCut - betterCut);
        const position = (userGrade - betterCut) / cutGap;
        chance = Math.round(80 - position * 24);

        // 같은 50~70%컷 사이여도 본인 등급의 위치에 따라 설명을 세분화합니다.
        let text = "적정 ✅";
        let msg = "";
        if (position <= 0.5) {
          chance = Math.round(80 - position * 12);
          msg = `본인 등급이 전년도 최종등록자 50%컷과 60%컷 사이에 위치합니다. 50%컷에서 비교적 가까운 편이라 교과성적 기준으로는 적정 지원 중에서도 합격 여유가 있는 구간으로 판단합니다. 다만 경쟁률과 충원 규모에 따라 실제 합격선은 달라질 수 있습니다.`;
        } else {
          chance = Math.round(68 - ((position - 0.5) / 0.5) * 12);
          msg = `본인 등급이 전년도 최종등록자 60%컷과 70%컷 사이에 위치합니다. 전년도 입결 범위 안에는 들어오지만 70%컷에 가까워질수록 합격 여유가 줄어드는 구간입니다. 교과성적만으로는 적정 지원으로 볼 수 있으나, 경쟁률·지원자 성적분포·충원 규모에 따라 결과가 달라질 가능성을 고려해야 합니다.`;
        }
        return {
          text,
          chance,
          bg: "bg-blue-950/60 border-blue-500/50 text-blue-300",
          barColor: "bg-blue-500",
          msg,
          diffText: (userGrade - cut50).toFixed(2),
          diffLabel: "50% 컷 대비 등급 차이",
          outcomeText: getOutcomeText(chance),
          interviewFlipText: getInterviewFlipText(userGrade),
        };
      }
    }

    let text = "";
    let bg = "";
    let barColor = "";
    let msg = "";

    if (category === "종합") {
      if (diff <= -1.0) {
        chance = 98;
        text = "과도하향 🔵";
        bg = "bg-cyan-950/60 border-cyan-500/50 text-cyan-300";
        barColor = "bg-cyan-500";
        msg = `최종등록자 ${secondCutPercent}%컷보다 1.0등급 이상 우수한 성적 구간입니다. 전년도 등록자 분포와 비교할 때 학업성적 측면의 우위가 매우 큰 편으로, 일반적인 경쟁환경에서는 높은 합격 안정성을 기대할 수 있는 지원입니다. 다만 학생부종합전형의 특성상 서류평가와 모집인원 변동은 별도의 변수로 작용합니다.`;
      } else if (diff <= -0.4) {
        chance = Math.round(88 + ((-0.4 - diff) / 0.6) * 9);
        text = "하향 🔽";
        bg = "bg-emerald-950/60 border-emerald-500/50 text-emerald-300";
        barColor = "bg-emerald-500";
        msg = `최종등록자 ${secondCutPercent}%컷보다 0.4~1.0등급 우수한 구간입니다. 전년도 입결을 기준으로 학업성적 경쟁력은 충분한 편이며 지원 안정성이 높게 평가됩니다. 다만 종합전형은 교과성적만으로 결과가 결정되지 않으므로 전공 적합성, 학생부의 활동 맥락과 서류평가 경쟁력을 함께 고려해야 합니다.`;
      } else if (diff <= 0) {
        chance = Math.round(76 + ((0 - diff) / 0.4) * 12);
        text = "안정 🟢";
        bg = "bg-teal-950/60 border-teal-500/50 text-teal-300";
        barColor = "bg-teal-500";
        msg = `최종등록자 ${secondCutPercent}%컷 이내의 성적으로, 전년도 등록자 분포와 비교했을 때 학업성적 측면에서 안정적인 위치입니다. 모집단위의 경쟁률과 충원 규모가 통상적인 범위에서 형성된다면 합격 가능성이 비교적 높게 평가되며, 최종 판단에서는 학생부의 전공 적합성과 서류 완성도를 함께 확인할 필요가 있습니다.`;
      } else if (diff <= 0.3) {
        chance = Math.round(66 - (diff / 0.3) * 18);
        text = "적정 ✅";
        bg = "bg-blue-950/60 border-blue-500/50 text-blue-300";
        barColor = "bg-blue-500";
        msg = `전년도 최종등록자 ${secondCutPercent}%컷보다 최대 0.3등급 낮은 구간까지 적정 지원으로 분류합니다. 다만 현재 성적이 컷에서 멀어질수록 통계적 안정성은 단계적으로 감소하도록 반영했습니다. 이 구간에서는 교과성적 자체보다 전공 적합성, 세부능력특기사항의 연계성, 활동의 지속성과 서류평가 경쟁력이 합격 여부에 미치는 영향이 커질 수 있습니다.`;
      } else if (diff <= 0.7) {
        chance = Math.round(47 - ((diff - 0.3) / 0.4) * 18);
        text = "소신 ✊";
        bg = "bg-amber-950/60 border-amber-500/50 text-amber-300";
        barColor = "bg-amber-500";
        msg = `최종등록자 ${secondCutPercent}%컷을 넘어선 성적 구간으로, 입결 통계만 놓고 보면 합격 안정성을 확보하기 어렵습니다. 다만 학생부의 전공 관련 활동과 학업역량이 모집단위에서 요구하는 수준과 잘 맞고 서류평가 경쟁력이 높다면 합격 가능성을 기대할 수 있어 소신 지원으로 판단합니다.`;
      } else if (diff <= 1.2) {
        chance = Math.round(29 - ((diff - 0.7) / 0.5) * 16);
        text = "상향(도전) 🔼";
        bg = "bg-orange-950/60 border-orange-500/50 text-orange-300";
        barColor = "bg-orange-500";
        msg = `전년도 최종등록자 ${secondCutPercent}%컷과 비교해 성적상 불리한 위치에 있는 상향 지원입니다. 통계적인 합격 가능성은 낮게 평가되지만, 모집단위의 경쟁률 하락이나 충원 확대, 그리고 학생부·서류평가에서의 뚜렷한 전공 적합성이 확인될 경우 결과가 달라질 수 있는 도전 구간입니다.`;
      } else {
        chance = Math.max(1, Math.round(12 - (diff - 1.2) * 6));
        text = "우주상향 🚀";
        bg = "bg-rose-950/60 border-rose-500/50 text-rose-300";
        barColor = "bg-rose-500";
        msg = `전년도 최종등록자 ${secondCutPercent}%컷과 상당한 성적 격차가 있는 고위험 지원입니다. 최근 입결 분포만으로는 합격 가능성을 낮게 평가해야 하는 구간이며, 경쟁률의 큰 하락이나 충원 규모의 확대와 같은 모집환경 변화 및 서류평가에서의 매우 강한 경쟁력이 동시에 요구될 수 있습니다.`;
      }
    } else {
      if (diff <= -1.0) {
        chance = 98;
        text = "과도하향 🔵";
        bg = "bg-cyan-950/60 border-cyan-500/50 text-cyan-300";
        barColor = "bg-cyan-500";
        msg =
          "최종등록자 50%컷보다 1.0등급 이상 우수한 성적 구간입니다. 전년도 입결과 비교해 학업성적의 상대적 우위가 매우 뚜렷하여 높은 합격 안정성이 기대되는 지원입니다. 다만 경쟁률, 모집인원 및 충원 규모 변화에 따라 실제 결과는 달라질 수 있습니다.";
      } else if (diff <= -0.4) {
        chance = Math.round(88 + ((-0.4 - diff) / 0.6) * 9);
        text = "하향 🔽";
        bg = "bg-emerald-950/60 border-emerald-500/50 text-emerald-300";
        barColor = "bg-emerald-500";
        msg =
          "최종등록자 50%컷보다 0.4~1.0등급 우수한 성적 구간입니다. 최근 등록자 입결을 기준으로 학업성적 경쟁력이 충분하며 안정적인 지원 위치로 판단합니다. 다만 지원자 성적분포와 경쟁률, 충원 규모에 따라 합격선이 변동될 가능성은 남아 있습니다.";
      } else if (diff <= 0) {
        chance = Math.round(76 + ((0 - diff) / 0.4) * 11);
        text = "안정 🟢";
        bg = "bg-teal-950/60 border-teal-500/50 text-teal-300";
        barColor = "bg-teal-500";
        msg =
          "최종등록자 50%컷 이내의 성적으로, 전년도 입결 분포에서 경쟁력 있는 위치에 해당합니다. 통상적인 경쟁률과 충원 규모를 전제로 할 때 합격 안정성이 높은 편으로 판단하며, 최종적으로는 해당 모집단위의 모집인원과 지원자 성적분포를 함께 고려해야 합니다.";
      } else if (diff <= 0.3) {
        chance = Math.round(70 - (diff / 0.3) * 16);
        text = "적정 ✅";
        bg = "bg-blue-950/60 border-blue-500/50 text-blue-300";
        barColor = "bg-blue-500";
        msg =
          "최종등록자 50%컷보다 최대 0.3등급 낮은 구간으로, 전년도 입결 분포상 적정 지원 범위에 해당합니다. 컷과의 거리가 커질수록 합격확률을 보수적으로 낮춰 반영했으며, 경쟁률·충원 규모·지원자 성적분포의 변화가 최종 결과에 영향을 줄 수 있습니다.";
      } else if (diff <= 0.7) {
        chance = Math.round(54 - ((diff - 0.3) / 0.4) * 23);
        text = "소신 ✊";
        bg = "bg-amber-950/60 border-amber-500/50 text-amber-300";
        barColor = "bg-amber-500";
        msg = `최종등록자 50%컷을 넘어선 성적으로 통계적 안정성은 낮아지는 구간입니다. 다만 ${secondCutPercent}%컷에 가까워질수록 실제 등록자 분포와 충원 결과의 영향을 받을 수 있어 합격 가능성이 완전히 배제되는 것은 아니며, 소신 지원으로 분류합니다.`;
      } else if (diff <= 1.2) {
        chance = Math.round(31 - ((diff - 0.7) / 0.5) * 18);
        text = "상향(도전) 🔼";
        bg = "bg-orange-950/60 border-orange-500/50 text-orange-300";
        barColor = "bg-orange-500";
        msg = `최종등록자 50%컷과 ${secondCutPercent}%컷 모두에 비해 불리한 성적 구간으로, 일반적인 입결 흐름에서는 합격 안정성을 기대하기 어렵습니다. 다만 경쟁률 하락, 충원 확대, 지원자 성적분포 변화 등 우호적인 변수가 발생할 경우 합격 가능성이 일부 열려 있는 도전 지원입니다.`;
      } else {
        chance = Math.max(1, Math.round(13 - (diff - 1.2) * 7));
        text = "우주상향 🚀";
        bg = "bg-rose-950/60 border-rose-500/50 text-rose-300";
        barColor = "bg-rose-500";
        msg = `최종등록자 ${secondCutPercent}%컷보다도 성적 격차가 크게 나타나는 고위험 상향 지원입니다. 전년도 입결 기준으로는 합격 가능성을 매우 낮게 평가해야 하며, 경쟁률의 큰 하락이나 충원 확대 등 상당한 모집환경 변화가 전제되어야 하는 구간입니다.`;
      }
    }

    chance = Math.min(99, Math.max(1, Math.round(chance)));
    const diffVal = diff.toFixed(2);
    const diffText = diff > 0 ? `+${diffVal}` : diffVal;
    const diffLabel =
      category === "종합"
        ? `${secondCutPercent}% 컷 대비 등급 차이`
        : "50% 컷 대비 등급 차이";

    return {
      text,
      chance,
      bg,
      barColor,
      msg,
      diffText,
      diffLabel,
      outcomeText: getOutcomeText(chance),
      interviewFlipText: getInterviewFlipText(userGrade),
    };
  };

  // ==========================================
  // 생기부 AI 평가 (자동 참고 분석)
  // ==========================================
  const analyzeBioLinkage = (
    text: string,
    deptName: string,
    collegeName: string
  ) => {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[·•,./()\[\]{}:_-]/g, "");
    const clean = normalize(text);
    const dept = normalize(deptName);

    // 전공별 핵심/보조 개념을 분리합니다. 핵심 개념은 학과와 직접 연결되고,
    // 보조 개념은 다른 계열에서도 흔히 등장하므로 단독으로는 높은 점수를 주지 않습니다.
    const domainProfiles: Array<{
      id: string;
      keys: string[];
      core: string[];
      support: string[];
    }> = [
      {
        id: "urban",
        keys: [
          "도시",
          "도시계획",
          "도시공학",
          "건축",
          "토목",
          "부동산",
          "교통",
          "공간",
          "지역개발",
        ],
        core: [
          "도시계획",
          "도시공학",
          "도시",
          "도시화",
          "지역개발",
          "도시재생",
          "스마트시티",
          "교통계획",
          "토지이용",
          "주거",
          "공간계획",
          "GIS",
          "지리정보",
          "부동산",
          "토지",
          "지역계획",
        ],
        support: [
          "교통",
          "환경",
          "지속가능",
          "인구",
          "사회",
          "경제",
          "정책",
          "건축",
          "토목",
          "데이터",
          "통계",
          "지도",
        ],
      },
      {
        id: "chemical",
        keys: [
          "화학",
          "화학공학",
          "신소재",
          "재료",
          "재료공학",
          "에너지",
          "환경공학",
        ],
        core: [
          "화학공학",
          "화학",
          "화학반응",
          "반응공학",
          "공정",
          "공정설계",
          "촉매",
          "열역학",
          "분리공정",
          "물질전달",
          "에너지공정",
          "고분자",
          "전기화학",
          "재료공학",
          "신소재",
          "배터리",
          "분자",
          "원자",
        ],
        support: [
          "환경",
          "에너지",
          "탄소",
          "실험",
          "분석",
          "수학",
          "물리",
          "데이터",
        ],
      },
      {
        id: "bio",
        keys: [
          "생명",
          "생물",
          "바이오",
          "의생명",
          "간호",
          "보건",
          "식품",
          "약학",
        ],
        core: [
          "생명과학",
          "생물",
          "세포",
          "유전",
          "단백질",
          "미생물",
          "생명공학",
          "바이오",
          "의생명",
          "질병",
          "임상",
          "간호",
          "보건",
          "영양",
          "식품",
          "약학",
        ],
        support: ["화학", "실험", "환경", "건강", "통계", "분석"],
      },
      {
        id: "engineering",
        keys: [
          "기계",
          "전기",
          "전자",
          "반도체",
          "컴퓨터",
          "소프트웨어",
          "인공지능",
          "ai",
          "로봇",
          "자동차",
          "산업공학",
        ],
        core: [
          "기계공학",
          "기계",
          "전기공학",
          "전자공학",
          "회로",
          "반도체",
          "컴퓨터",
          "소프트웨어",
          "인공지능",
          "코딩",
          "프로그래밍",
          "알고리즘",
          "로봇",
          "자동차",
          "모빌리티",
          "산업공학",
          "시스템",
          "설계",
        ],
        support: ["수학", "물리", "데이터", "분석", "모델링", "공정"],
      },
      {
        id: "business",
        keys: ["경영", "경제", "회계", "무역", "금융", "통상", "마케팅"],
        core: [
          "경영",
          "경제",
          "기업",
          "회계",
          "재무",
          "금융",
          "시장",
          "마케팅",
          "소비자",
          "무역",
          "통상",
          "창업",
          "경영정보",
          "조직",
          "인사",
        ],
        support: ["데이터", "통계", "분석", "정책", "사회"],
      },
      {
        id: "social",
        keys: [
          "행정",
          "정책",
          "법",
          "정치",
          "사회",
          "복지",
          "공공",
          "심리",
          "상담",
          "교육",
        ],
        core: [
          "행정",
          "정책",
          "정부",
          "공공",
          "법",
          "법률",
          "정치",
          "사회",
          "복지",
          "지역사회",
          "제도",
          "공익",
          "심리",
          "상담",
          "교육",
          "학습",
          "발달",
        ],
        support: ["인구", "도시", "경제", "통계", "데이터", "문화"],
      },
      {
        id: "language",
        keys: [
          "국어",
          "문학",
          "언어",
          "영어",
          "중어",
          "중문",
          "일본",
          "일어",
          "외국어",
        ],
        core: [
          "국어",
          "문학",
          "언어",
          "글쓰기",
          "독서",
          "비평",
          "영어",
          "영문",
          "번역",
          "통역",
          "중국어",
          "중어",
          "중문",
          "일본어",
          "일어",
          "일문",
        ],
        support: ["문화", "미디어", "커뮤니케이션", "사회"],
      },
      {
        id: "media",
        keys: [
          "미디어",
          "언론",
          "방송",
          "콘텐츠",
          "홍보",
          "광고",
          "커뮤니케이션",
        ],
        core: [
          "미디어",
          "언론",
          "뉴스",
          "방송",
          "영상",
          "콘텐츠",
          "홍보",
          "광고",
          "저널리즘",
          "커뮤니케이션",
          "미디어콘텐츠",
        ],
        support: ["글쓰기", "디자인", "문화", "사회", "마케팅"],
      },
      {
        id: "tourism",
        keys: ["관광", "호텔", "여행", "항공", "서비스", "외식"],
        core: [
          "관광",
          "호텔",
          "여행",
          "항공",
          "서비스",
          "고객",
          "축제",
          "문화관광",
          "외식",
        ],
        support: ["문화", "지역", "경제", "마케팅"],
      },
      {
        id: "art",
        keys: ["디자인", "뷰티", "미술", "예술", "음악", "체육", "스포츠"],
        core: [
          "디자인",
          "시각디자인",
          "산업디자인",
          "UX",
          "브랜딩",
          "미술",
          "회화",
          "조형",
          "예술",
          "음악",
          "연주",
          "작곡",
          "체육",
          "스포츠",
          "운동",
        ],
        support: ["콘텐츠", "문화", "심리", "미디어"],
      },
      {
        id: "mathscience",
        keys: ["수학", "통계", "물리", "수리", "데이터"],
        core: [
          "수학",
          "통계",
          "확률",
          "수리",
          "물리",
          "역학",
          "광학",
          "데이터사이언스",
          "데이터분석",
          "모델링",
        ],
        support: ["코딩", "알고리즘", "실험", "분석"],
      },
    ];

    const fallbackTerms = deptName
      .replace(/학과|학부|전공|계열|과$/g, " ")
      .replace(/[^가-힣A-Za-z0-9]/g, " ")
      .split(/\s+/)
      .map((v) => v.trim())
      .filter((v) => v.length >= 2);
    const collegeTerms = (collegeName || "")
      .replace(/대학|단과대|학부|계열/g, " ")
      .replace(/[^가-힣A-Za-z0-9]/g, " ")
      .split(/\s+/)
      .map((v) => v.trim())
      .filter((v) => v.length >= 2);

    // 학과명과 정확히 맞는 계열을 우선 선택합니다. 여러 계열이 잡히는 융합학과는
    // 첫 계열만 쓰지 않고 최대 2개까지 주전공 후보로 사용합니다.
    const inferred = domainProfiles.filter((p) =>
      p.keys.some((k) => dept.includes(normalize(k)))
    );
    const profiles = inferred.length ? inferred.slice(0, 2) : [];
    const coreTerms = Array.from(new Set(profiles.flatMap((p) => p.core)));
    const supportTerms = Array.from(
      new Set(profiles.flatMap((p) => p.support))
    );
    const allTerms = Array.from(new Set([...coreTerms, ...supportTerms]));

    const chunks = text
      .split(
        /[.!?\n]|(?=세부능력및특기사항)|(?=창의적체험활동)|(?=진로활동)|(?=동아리활동)|(?=독서활동)/
      )
      .map((s) => s.trim())
      .filter((s) => s.length >= 8);
    const activityContext = [
      "탐구",
      "연구",
      "보고서",
      "발표",
      "프로젝트",
      "실험",
      "토론",
      "독서",
      "동아리",
      "진로",
      "세특",
      "캠페인",
      "대회",
      "수행",
      "제작",
      "분석",
      "조사",
      "설계",
      "기획",
      "문제해결",
    ];
    const depthContext = [
      "심화",
      "확장",
      "후속",
      "연계",
      "발전",
      "비교",
      "원인",
      "근거",
      "자료",
      "통계",
      "결과",
      "해석",
      "적용",
      "개선",
      "성찰",
      "피드백",
      "주도",
      "스스로",
    ];

    const evidence: Array<{
      term: string;
      hits: number;
      activity: number;
      depth: number;
      strong: number;
    }> = [];
    let coreHits = 0,
      coreActivity = 0,
      coreDepth = 0,
      supportActivity = 0,
      strongContext = 0;
    for (const term of allTerms) {
      const nt = normalize(term);
      if (!nt) continue;
      let hits = 0,
        activity = 0,
        depth = 0,
        strong = 0;
      for (const chunk of chunks) {
        const nc = normalize(chunk);
        if (!nc.includes(nt)) continue;
        hits++;
        const hasActivity = activityContext.some((w) =>
          nc.includes(normalize(w))
        );
        const hasDepth = depthContext.some((w) => nc.includes(normalize(w)));
        if (hasActivity) activity++;
        if (hasDepth) depth++;
        if (hasActivity && hasDepth) strong++;
      }
      if (hits)
        evidence.push({
          term,
          hits: Math.min(hits, 6),
          activity,
          depth,
          strong,
        });
      if (coreTerms.includes(term)) {
        coreHits += Math.min(hits, 5);
        coreActivity += activity;
        coreDepth += depth;
      } else {
        supportActivity += activity;
      }
      strongContext += strong;
    }

    // 핵심 전공 개념의 "활동 동반 여부"를 가장 중요하게 보고, 보조 키워드는 제한적으로만 반영합니다.
    const uniqueCore = new Set(
      evidence.filter((e) => coreTerms.includes(e.term)).map((e) => e.term)
    ).size;
    const uniqueSupport = new Set(
      evidence.filter((e) => supportTerms.includes(e.term)).map((e) => e.term)
    ).size;
    const coreBreadth = Math.min(18, uniqueCore * 3.2);
    const coreRepeat = Math.min(11, coreHits * 1.0);
    const coreActivityScore = Math.min(25, coreActivity * 2.7);
    const depthScore = Math.min(18, coreDepth * 2.7);
    const strongScore = Math.min(17, strongContext * 2.8);
    const supportScore = Math.min(
      4,
      supportActivity * 0.45 + uniqueSupport * 0.25
    );

    // 전공 핵심 개념이 거의 없고 보조 개념만 있는 경우에는 높은 점수를 막습니다.
    const hasCoreEvidence = uniqueCore > 0;
    const hasCoreActivity = coreActivity > 0;
    let linkage =
      8 +
      coreBreadth +
      coreRepeat +
      coreActivityScore +
      depthScore +
      strongScore +
      supportScore;
    if (!hasCoreEvidence) linkage -= 30;
    if (hasCoreEvidence && !hasCoreActivity) linkage -= 28;
    if (uniqueCore <= 1) linkage -= 12;
    if (uniqueCore <= 2 && coreActivity <= 2) linkage -= 8;

    // 다른 계열의 핵심어가 강하게 나타나는 경우 상대적 불일치로 추가 감점합니다.
    const otherProfiles = domainProfiles.filter(
      (p) => !profiles.some((pp) => pp.id === p.id)
    );
    const otherCoreHits = otherProfiles.reduce((sum, p) => {
      return (
        sum +
        p.core.reduce(
          (n, term) =>
            n + (clean.match(new RegExp(normalize(term), "g")) || []).length,
          0
        )
      );
    }, 0);
    if (otherCoreHits >= 8 && coreActivity < 2) linkage -= 24;
    else if (otherCoreHits >= 4 && coreActivity < 3) linkage -= 14;
    else if (otherCoreHits >= 2 && coreActivity < 2) linkage -= 7;

    // 학과명에서 추출된 직접 토큰은 '문맥+활동'이 있을 때만 보너스를 줍니다.
    const directTokens = Array.from(
      new Set(fallbackTerms.filter((t) => t.length >= 2))
    );
    const directActivityHits = chunks.filter((chunk) => {
      const nc = normalize(chunk);
      const hasDirect = directTokens.some((token) =>
        nc.includes(normalize(token))
      );
      const hasActivity = activityContext.some((w) =>
        nc.includes(normalize(w))
      );
      const hasDepth = depthContext.some((w) => nc.includes(normalize(w)));
      return hasDirect && hasActivity && hasDepth;
    }).length;
    linkage += Math.min(10, directActivityHits * 2.5);

    // 서로 다른 계열의 일반 단어만으로 80~100이 나오지 않도록 상한을 둡니다.
    if (uniqueCore <= 1 && coreActivity <= 1) linkage = Math.min(linkage, 30);
    else if (uniqueCore <= 2 && coreActivity <= 2)
      linkage = Math.min(linkage, 45);
    else if (uniqueCore <= 3 && strongContext <= 2)
      linkage = Math.min(linkage, 60);
    else if (uniqueCore <= 4 && strongContext <= 3)
      linkage = Math.min(linkage, 72);

    linkage = Math.max(0, Math.min(100, Math.round(linkage)));

    const matchedKeywords = evidence
      .sort(
        (a, b) =>
          b.activity * 3 +
          b.depth * 2 +
          b.hits -
          (a.activity * 3 + a.depth * 2 + a.hits)
      )
      .slice(0, 10)
      .map((e) => e.term);

    const linkageLevel =
      linkage >= 85
        ? "높음"
        : linkage >= 70
        ? "양호"
        : linkage >= 55
        ? "보통"
        : linkage >= 40
        ? "낮음"
        : "매우 낮음";
    const linkageComment =
      linkage >= 85
        ? `선택 학과의 핵심 전공 개념이 여러 활동에서 확인되고, 탐구·분석·발표 및 심화·후속 맥락까지 함께 나타납니다. 단순 키워드보다 실제 활동 근거가 충분한 편입니다.`
        : linkage >= 70
        ? `선택 학과와 연결되는 핵심 개념과 활동 근거가 확인됩니다. 다만 핵심 주제를 지속적인 탐구와 후속 활동으로 확장하면 전공 방향성이 더 선명해질 수 있습니다.`
        : linkage >= 55
        ? `일부 관련 개념은 확인되지만 핵심 전공 개념의 반복성과 활동 맥락이 충분하지 않습니다. 단순 언급보다 전공 관련 탐구의 구체성과 지속성을 확인할 필요가 있습니다.`
        : linkage >= 40
        ? `선택 학과와 직접 연결되는 핵심 전공 활동이 제한적으로 확인됩니다. 다른 계열에서도 흔히 쓰이는 일반 키워드는 낮게 평가하고 실제 전공 탐구 근거를 중심으로 판단했습니다.`
        : `현재 생기부에서 선택 학과의 핵심 전공 개념과 연결된 구체적 활동 근거가 매우 제한적입니다. 전공 키워드의 단순 등장만으로 높은 연계성을 부여하지 않았습니다.`;

    return {
      linkage,
      matchedKeywords,
      linkageLevel,
      linkageComment,
      evidenceCount: evidence.length,
      activityContextCount: new Set(
        evidence.filter((e) => e.activity > 0).map((e) => e.term)
      ).size,
      directActivityHits,
      coreConceptCount: uniqueCore,
      coreActivityHits: coreActivity,
      strongContextCount: strongContext,
      competingDomainHits: otherCoreHits,
    };
  };

  const analyzeRecordBook = useMemo(() => {
    if (!recordBookHtml || !selectedDept) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(recordBookHtml, "text/html");
    doc.querySelectorAll("script,style,noscript").forEach((el) => el.remove());
    const text = (doc.body?.innerText || doc.body?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    const lower = text.toLowerCase();
    const deptName = selectedDept.name;

    const subjectGradeValues = records
      .map((r) => r.rankGrade)
      .filter((v): v is number => typeof v === "number" && v > 0 && v <= 9);
    const avg = subjectGradeValues.length
      ? subjectGradeValues.reduce((a, b) => a + b, 0) /
        subjectGradeValues.length
      : null;
    const gradeScore =
      avg == null ? 55 : Math.max(0, Math.min(100, 100 - (avg - 1) * 12.5));
    const countMatches = (words: string[]) =>
      words.reduce((n, w) => n + (lower.includes(w.toLowerCase()) ? 1 : 0), 0);
    const rawText = (
      doc.body?.innerText ||
      doc.body?.textContent ||
      ""
    ).replace(/\r/g, "");
    const sectionSignals = {
      attendance: /(출결상황|출결)/.test(rawText),
      academic:
        /(교과학습발달상황|세부능력및특기사항|세특|성취도|석차등급)/.test(
          rawText
        ),
      creative: /(창의적체험활동|자율활동|동아리활동|진로활동)/.test(rawText),
      reading: /(독서활동상황|독서활동|도서명|저자)/.test(rawText),
      behavior: /(행동특성및종합의견|행동특성|종합의견)/.test(rawText),
      awards: /(수상경력|수상)/.test(rawText),
    };
    const sectionCoverage = Math.round(
      (Object.values(sectionSignals).filter(Boolean).length /
        Object.keys(sectionSignals).length) *
        100
    );
    const analysisChunks = rawText
      .split(/[.!?\n]/)
      .map((v) => v.replace(/\s+/g, " ").trim())
      .filter((v) => v.length >= 12);
    const academicSignals = [
      "질문",
      "탐구",
      "분석",
      "비교",
      "근거",
      "자료",
      "문제해결",
      "실험",
      "토론",
      "발표",
      "보고서",
      "성찰",
      "수학적",
      "논리적",
    ];
    const careerSignals = [
      "진로",
      "전공",
      "탐구",
      "연구",
      "프로젝트",
      "보고서",
      "발표",
      "설계",
      "기획",
      "심화",
      "후속",
      "확장",
      "연계",
      "독서",
    ];
    const communitySignals = [
      "협력",
      "협업",
      "소통",
      "배려",
      "책임",
      "역할",
      "주도",
      "리더십",
      "봉사",
      "멘토링",
      "학생회",
      "학급",
    ];
    const signalCount = (words: string[]) =>
      words.reduce(
        (sum, word) =>
          sum + (lower.match(new RegExp(word.toLowerCase(), "g")) || []).length,
        0
      );

    const extractAttendanceCounts = () => {
      let absent = 0,
        late = 0,
        early = 0,
        unauthorized = 0;
      const tables = Array.from(doc.querySelectorAll("table"));
      const attendanceTables = tables.filter((table) => {
        const t = (table.textContent || "").replace(/\s+/g, " ");
        return (
          /출결상황/.test(t) &&
          /결석/.test(t) &&
          /지각/.test(t) &&
          /조퇴/.test(t)
        );
      });
      attendanceTables.forEach((table) => {
        Array.from(table.querySelectorAll("tr")).forEach((row) => {
          const cells = Array.from(row.querySelectorAll("th,td"));
          const texts = cells.map((c) =>
            (c.textContent || "").replace(/\s+/g, " ").trim()
          );
          const categoryIndex = texts.findIndex((v) =>
            /^(미인정|질병|기타)(?:\s*(결석|지각|조퇴|결과))?$/.test(v)
          );
          if (categoryIndex < 0) return;
          const nums = texts
            .slice(categoryIndex + 1)
            .flatMap((v) => (/^\d+(?:\.\d+)?$/.test(v) ? [Number(v)] : []));
          if (nums.length < 3) return;
          const a = nums[0] || 0,
            l = nums[1] || 0,
            e = nums[2] || 0;
          if (
            /^미인정(?:\s*(결석|지각|조퇴|결과))?$/.test(texts[categoryIndex])
          )
            unauthorized += a + l + e;
          absent += a;
          late += l;
          early += e;
        });
      });
      return { absent, late, early, unauthorized };
    };

    const attendance = extractAttendanceCounts();
    const { absent, late, early, unauthorized } = attendance;
    const attendancePenalty = Math.min(
      35,
      absent * 5 + late * 1.5 + early * 1.5 + unauthorized * 3
    );
    const attendanceScore = Math.max(0, 100 - attendancePenalty);
    const linkageData = analyzeBioLinkage(text, deptName, selectedDept.college);
    const activityWords = [
      "세부능력",
      "특기사항",
      "탐구",
      "보고서",
      "발표",
      "프로젝트",
      "독서",
      "토론",
      "실험",
      "동아리",
      "진로활동",
      "교과세특",
      "창의적체험활동",
    ];
    const careerBase = countMatches(activityWords);
    const communityKeywords = [
      "봉사",
      "협력",
      "협업",
      "배려",
      "리더십",
      "학급회장",
      "학생회",
      "공동체",
      "소통",
      "책임",
      "캠페인",
      "멘토링",
      "도움",
    ];
    const communityActivity = Math.min(
      100,
      35 + countMatches(communityKeywords) * 7
    );

    // 학업역량은 생기부 문구보다 실제 성적·입결 수준을 중심으로 비교적 관대하게 평가합니다.
    const cut50 = selectedAdmission?.cutoffs?.finalPass50CutGrade;
    const cut75 = selectedAdmission?.cutoffs?.finalPass75CutGrade;
    const admissionCut =
      typeof cut50 === "number" && typeof cut75 === "number"
        ? (cut50 + cut75) / 2
        : typeof cut50 === "number"
        ? cut50
        : cut75;
    const gradeBase =
      avg == null
        ? 58
        : Math.max(35, Math.min(98, 96 - Math.max(0, avg - 1) * 9.5));
    const relativeGrade =
      avg != null && typeof admissionCut === "number"
        ? Math.max(35, Math.min(98, 78 + (admissionCut - avg) * 11))
        : gradeBase;
    const autoAcademic = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          gradeBase * 0.45 + relativeGrade * 0.4 + attendanceScore * 0.15
        )
      )
    );

    // 진로·공동체는 키워드 개수보다 실제 활동 문맥과 지속성을 더 엄격하게 반영합니다.
    const careerEvidenceFactor = Math.min(
      100,
      25 +
        careerBase * 4.5 +
        linkageData.directActivityHits * 5 +
        linkageData.strongContextCount * 2
    );
    const autoCareer = Math.round(
      Math.max(
        0,
        Math.min(100, linkageData.linkage * 0.68 + careerEvidenceFactor * 0.32)
      )
    );
    const communityEvidenceFactor = Math.min(
      100,
      20 +
        countMatches(communityKeywords) * 5.2 +
        Math.max(0, signalCount(communitySignals) - 2) * 1.5
    );
    const autoCommunity = Math.round(
      Math.max(
        0,
        Math.min(100, communityEvidenceFactor * 0.78 + attendanceScore * 0.22)
      )
    );
    // 셀프 평가와 코드 기준평가를 분리하고, 최종 평가는 코드 기준 70% + 셀프 평가 30%로 보수적으로 결합
    const selfAcademic = bioRatings.academic
      ? BIO_GRADE_SCORE[bioRatings.academic]
      : null;
    const selfCareer = bioRatings.career
      ? BIO_GRADE_SCORE[bioRatings.career]
      : null;
    const selfCommunity = bioRatings.community
      ? BIO_GRADE_SCORE[bioRatings.community]
      : null;
    const academic = Math.round(
      autoAcademic * 0.7 + (selfAcademic ?? autoAcademic) * 0.3
    );
    const career = Math.round(
      autoCareer * 0.7 + (selfCareer ?? autoCareer) * 0.3
    );
    const community = Math.round(
      autoCommunity * 0.7 + (selfCommunity ?? autoCommunity) * 0.3
    );
    const totalWeight =
      bioWeights.academic + bioWeights.career + bioWeights.community || 1;
    const weighted = Math.round(
      (academic * bioWeights.academic +
        career * bioWeights.career +
        community * bioWeights.community) /
        totalWeight
    );

    const strengths: string[] = [];
    const improvements: string[] = [];
    if (academic >= 80)
      strengths.push(
        "학업역량 평가가 높고 교과 성적·학업 지속성 측면에서 강점이 있습니다."
      );
    if (career >= 75)
      strengths.push(
        `진로역량 평가가 높으며 ${deptName}과 연결되는 탐구·활동의 근거가 비교적 잘 드러납니다.`
      );
    if (community >= 75)
      strengths.push(
        "협력·봉사·리더십 등 공동체 관련 기록을 긍정적으로 평가할 수 있습니다."
      );
    if (attendanceScore >= 95)
      strengths.push("출결상황이 안정적인 편으로 분석됩니다.");
    if (!strengths.length)
      strengths.push(
        "현재 입력된 생기부에서 학업·진로·공동체 영역의 기본적인 평가 근거가 확인됩니다."
      );
    if (academic < 70)
      improvements.push(
        "학업역량은 교과 성적의 안정성과 수업 속 탐구의 깊이를 함께 보완하는 것이 좋습니다."
      );
    if (career < 70 || linkageData.linkage < 65)
      improvements.push(
        `${deptName}과 직접 연결되는 탐구를 일회성으로 끝내기보다 독서→탐구→발표/보고서→후속 활동처럼 이어지는 흐름을 만드는 것이 좋습니다.`
      );
    if (community < 70)
      improvements.push(
        "공동체 활동은 참여 여부보다 맡은 역할, 협력 과정, 문제 해결과 기여가 드러나도록 기록의 구체성을 높이는 것이 좋습니다."
      );
    if (attendanceScore < 90)
      improvements.push(
        `출결상황에서 결석 ${absent}회·지각 ${late}회·조퇴 ${early}회·미인정 ${unauthorized}회가 확인되어 출결 안정성이 보완점으로 반영되었습니다.`
      );
    if (!improvements.length)
      improvements.push(
        "현재 뚜렷한 보완 신호는 적지만 활동의 깊이·지속성·후속 탐구를 유지하는 것이 좋습니다."
      );

    const evidenceSnippets = analysisChunks
      .filter((chunk) => {
        const nc = chunk.toLowerCase().replace(/\s+/g, "");
        return (
          linkageData.matchedKeywords.some((k) =>
            nc.includes(k.toLowerCase().replace(/\s+/g, ""))
          ) &&
          [
            "탐구",
            "연구",
            "보고서",
            "프로젝트",
            "발표",
            "분석",
            "설계",
            "기획",
            "실험",
          ].some((k) => nc.includes(k))
        );
      })
      .slice(0, 5);
    const detailedComments = {
      academic:
        academic >= 85
          ? `교과 평균 ${
              avg == null ? "미확인" : avg.toFixed(2) + "등급"
            }과 학업 행동 신호 ${signalCount(
              academicSignals
            )}건을 함께 확인해 성취와 학습 과정이 강점으로 포착됩니다.`
          : academic >= 70
          ? `기본적인 학업 근거는 확인됩니다. 결과뿐 아니라 질문→탐구→분석→결과로 이어지는 학습 과정이 더 선명하면 좋습니다.`
          : `학업 관련 근거가 상대적으로 약합니다. 수업 속 질문, 자료 활용, 문제 해결, 탐구 과정과 결과가 구체적으로 드러나는지 확인할 필요가 있습니다.`,
      career:
        career >= 85
          ? `선택 학과와 관련된 개념 ${linkageData.matchedKeywords.length}개, 활동 문맥 ${linkageData.activityContextCount}개, 직접 활동 근거 ${linkageData.directActivityHits}건이 확인됩니다.`
          : career >= 70
          ? `전공 관련 개념과 활동은 확인되지만 심화·후속·확장 활동이 이어지는 구조가 더 많이 드러나면 전공 방향성이 선명해집니다.`
          : `전공 키워드의 단순 언급은 높게 평가하지 않았습니다. 실제 탐구·프로젝트·보고서 등 활동 근거를 중심으로 보완하는 것이 좋습니다.`,
      community:
        community >= 85
          ? `협력·책임·역할·소통 등 공동체 행동 신호 ${signalCount(
              communitySignals
            )}건이 확인됩니다.`
          : community >= 70
          ? `공동체 활동의 기본 근거는 있으나 맡은 역할과 협력 과정, 본인의 기여 결과가 구체적으로 드러나면 더 좋습니다.`
          : `공동체 관련 행동 근거가 상대적으로 적습니다. 봉사 횟수보다 협업·책임·역할과 기여 결과를 중심으로 확인하는 것이 좋습니다.`,
    };

    return {
      scores: { academic, career, community, total: weighted },
      gradeLabels: {
        academic: scoreToBioGrade(academic),
        career: scoreToBioGrade(career),
        community: scoreToBioGrade(community),
        total: scoreToBioGrade(weighted),
      },
      selfScores: {
        academic: selfAcademic,
        career: selfCareer,
        community: selfCommunity,
      },
      selfGradeLabels: {
        academic: selfAcademic == null ? "-" : scoreToBioGrade(selfAcademic),
        career: selfCareer == null ? "-" : scoreToBioGrade(selfCareer),
        community: selfCommunity == null ? "-" : scoreToBioGrade(selfCommunity),
      },
      autoScores: {
        academic: autoAcademic,
        career: autoCareer,
        community: autoCommunity,
      },
      autoGradeLabels: {
        academic: scoreToBioGrade(autoAcademic),
        career: scoreToBioGrade(autoCareer),
        community: scoreToBioGrade(autoCommunity),
      },
      detailedComments,
      evidenceSnippets,
      sectionCoverage,
      sectionSignals,
      coverage: { total: sectionCoverage, sections: sectionSignals },
      signalCounts: {
        academic: signalCount(academicSignals),
        career: signalCount(careerSignals),
        community: signalCount(communitySignals),
      },
      attendance: {
        absent,
        late,
        early,
        unauthorized,
        score: Math.round(attendanceScore),
      },
      linkage: linkageData.linkage,
      linkageLevel: linkageData.linkageLevel,
      linkageComment: linkageData.linkageComment,
      matchedKeywords: linkageData.matchedKeywords,
      strengths,
      improvements,
      summary:
        weighted >= 85
          ? `전반적으로 높은 수준의 참고 평가입니다. ${detailedComments.career} ${detailedComments.community}`
          : weighted >= 70
          ? `기본적인 경쟁력을 갖춘 참고 평가입니다. ${detailedComments.academic} ${detailedComments.career}`
          : `현재 일부 보완 신호가 확인됩니다. ${detailedComments.academic} ${detailedComments.career} ${detailedComments.community}`,
    };
  }, [recordBookHtml, selectedDept, records, bioWeights, bioRatings]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const html = event.target.result as string;
          const parsed = parseNeisHtml(html);
          if (parsed.length === 0)
            setErrorMsg("성적 데이터를 찾을 수 없습니다.");
          else {
            setRecordBookHtml(html);
            setBioAnalyzedTargetKey(null);
            setBioRatings({ academic: null, career: null, community: null });
            setRecords(parsed);
            setStep("preview");
          }
        }
      } catch (err) {
        setErrorMsg("파일 분석 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const [manualInput, setManualInput] = useState({
    grade: 1,
    semester: 1,
    type: "regular",
    subject: "",
    credits: 3,
    rankGrade: 3,
  });

  const addManualRecord = () => {
    if (!manualInput.subject.trim()) return;
    const newRecord: GradeRecord = {
      id: Math.random().toString(36).slice(2, 11),
      grade: manualInput.grade as 1 | 2 | 3,
      semester: manualInput.semester as 1 | 2,
      tableType: manualInput.type as "regular" | "career",
      subjectGroup: "기타",
      subject: manualInput.subject,
      credits: manualInput.credits,
      rawScore: null,
      average: null,
      stdDev: null,
      studentCount: null,
      achievement: null,
      achievementRatio: null,
      rankGrade: manualInput.type === "regular" ? manualInput.rankGrade : null,
    };
    setRecords([newRecord, ...records]);
    setManualInput({ ...manualInput, subject: "" });
  };

  const handleAdmissionChange = (id: string) => {
    setSelectedAdmissionId(id);
    setBioAnalyzedTargetKey(null);
    setBioRatings({ academic: null, career: null, community: null });
    const adm = selectedDept?.admissions.find((a) => a.id === id);
    if (adm?.category === "종합") {
      if (allSubjectAvg) setAdigaGrade(allSubjectAvg.toFixed(2));
      else setAdigaGrade("");
    } else {
      setAdigaGrade("");
    }
  };

  // 사용자 직접 신규 대학/학과 등록 처리
  const handleAddNewUniversity = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customUnivInput.univName.trim() ||
      !customUnivInput.deptName.trim() ||
      !customUnivInput.admissionName.trim()
    ) {
      alert("대학명, 학과명, 전형명을 모두 입력해주세요.");
      return;
    }

    const c50 = parseFloat(customUnivInput.cut50);
    const c75 = parseFloat(customUnivInput.cut75);

    const newAdmission: AdmissionType = {
      id: `custom-adm-${Date.now()}`,
      name: customUnivInput.admissionName,
      category: customUnivInput.category,
      cutoffs: {
        finalPass50CutGrade: isNaN(c50) ? undefined : c50,
        finalPass75CutGrade: isNaN(c75) ? undefined : c75,
      },
    };

    const newDept: Department = {
      id: `custom-dept-${Date.now()}`,
      name: customUnivInput.deptName,
      college: "직접입력학과",
      admissions: [newAdmission],
    };

    const univId = `custom-univ-${Date.now()}`;

    const newUniv: UniversityData = {
      id: univId,
      name: customUnivInput.univName,
      campus: customUnivInput.campus || "본교",
      departments: [newDept],
    };

    setUnivDatabase((prev) => [...prev, newUniv]);

    setSelectedUnivId(univId);
    setSelectedDeptId(newDept.id);
    setSelectedAdmissionId(newAdmission.id);

    setShowAddUnivModal(false);
    setCustomUnivInput({
      univName: "",
      campus: "본교",
      deptName: "",
      admissionName: "학생부교과 (일반)",
      category: "교과",
      cut50: "",
      cut75: "",
    });
  };

  return (
    <>
      <style>{`
        /* 강제 가독성 보호: 전역/Tailwind 충돌에도 버튼 텍스트가 사라지지 않도록 고정 */
        .ui-readable-primary,
        .ui-readable-primary:visited,
        .ui-readable-primary:hover,
        .ui-readable-primary:focus,
        .ui-readable-primary:active {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          text-shadow: none !important;
          opacity: 1 !important;
        }
        .ui-readable-primary:disabled {
          color: #64748b !important;
          -webkit-text-fill-color: #64748b !important;
          background-color: #cbd5e1 !important;
          opacity: 1 !important;
        }
        .ui-readable-primary * {
          color: inherit !important;
          -webkit-text-fill-color: inherit !important;
        }
        /* 생기부 심층분석 전용 액션 버튼: iOS/iPadOS Safari의 text-fill 상속까지 차단 */
        button.bio-action-confirm,
        button.bio-action-confirm:visited,
        button.bio-action-confirm:hover,
        button.bio-action-confirm:focus,
        button.bio-action-confirm:active {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background-color: #7c3aed !important;
          opacity: 1 !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        button.bio-action-confirm > span,
        button.bio-action-confirm > span * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
        }
        button.bio-action-confirm:disabled {
          color: #64748b !important;
          -webkit-text-fill-color: #64748b !important;
          background-color: #cbd5e1 !important;
        }
        .ui-readable-secondary,
        .ui-readable-secondary:hover,
        .ui-readable-secondary:focus {
          color: #334155 !important;
          -webkit-text-fill-color: #334155 !important;
          background-color: #f1f5f9 !important;
        }
        /* ULTRA FIX: 생기부 UI 두 영역은 Tailwind/iOS 기본 스타일을 완전히 우회 */
        .bio-reference-badge {
          display: inline-block !important;
          color: rgb(109,40,217) !important;
          -webkit-text-fill-color: rgb(109,40,217) !important;
          background: rgb(255,255,255) !important;
          opacity: 1 !important;
          mix-blend-mode: normal !important;
          filter: none !important;
          text-shadow: none !important;
          -webkit-font-smoothing: antialiased !important;
        }
        button.bio-disclaimer-confirm,
        button.bio-disclaimer-confirm span,
        button.bio-disclaimer-confirm span * {
          color: rgb(255,255,255) !important;
          -webkit-text-fill-color: rgb(255,255,255) !important;
          background-image: none !important;
          opacity: 1 !important;
          mix-blend-mode: normal !important;
          filter: none !important;
          text-shadow: none !important;
          -webkit-font-smoothing: antialiased !important;
        }
        button.bio-disclaimer-confirm {
          background: rgb(124,58,237) !important;
          background-color: rgb(124,58,237) !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        button.bio-deep-start,
        button.bio-deep-start span,
        button.bio-deep-start span * {
          color: rgb(255,255,255) !important;
          -webkit-text-fill-color: rgb(255,255,255) !important;
          opacity: 1 !important;
          mix-blend-mode: normal !important;
          filter: none !important;
          text-shadow: none !important;
        }
        button.bio-deep-start {
          background: rgb(124,58,237) !important;
          background-color: rgb(124,58,237) !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        .ui-readable-select,
        .ui-readable-select option {
          color: #0f172a !important;
          -webkit-text-fill-color: #0f172a !important;
          background-color: #ffffff !important;
        }
      `}</style>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-20">
        {/* 상단 네비게이션 헤더 */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 md:px-8 py-3.5">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={resetApp}
            >
              <span className="text-2xl">🎯</span>
              <span className="font-black text-lg md:text-xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                대학 입학 도우미
              </span>
            </div>

            {step !== "home" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-1.5 rounded-full text-xs md:text-sm transition-all cursor-pointer border border-slate-200"
                >
                  <span>⬅️</span> 이전
                </button>
                <button
                  onClick={resetApp}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3.5 py-1.5 rounded-full text-xs md:text-sm transition-all cursor-pointer border border-indigo-200/60"
                >
                  <span>🏠</span> 처음으로
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6">
          {/* 헤더 섹션 */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/80 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"></div>

            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <span>✨</span> 2027학년도 대학 AI 합격 예측
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
              수시 ON
            </h1>

            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto font-medium">
              나이스 생활기록부 파일 업로드 하나로 전교과 환산 내신과 정밀 합격
              확률을 한눈에 확인하세요.
            </p>

            {step === "home" && (
              <p className="text-slate-400 font-medium text-xs mt-4">
                ver 2.7 | Made by jeongwoo yoon | blog :{" "}
                <a
                  href="https://m.blog.naver.com/w_oo_0x"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-500 font-bold hover:underline"
                >
                  @yoon
                </a>
              </p>
            )}

            {/* STEP 0: 모드 선택 */}
            {step === "home" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-3xl mx-auto">
                <button
                  onClick={() => {
                    setMode("analyze");
                    setStep("input-method");
                  }}
                  className="group relative bg-slate-50 hover:bg-blue-50/50 p-8 md:p-10 rounded-2xl border-2 border-slate-200/80 hover:border-blue-500 transition-all duration-200 text-left cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                      📊
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      성적 분석하기
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      교과 조합별, 반영 비율별 내 성적을 세밀하게 자동
                      산출합니다.
                    </p>
                  </div>
                  <div className="mt-8 flex items-center text-blue-600 font-bold text-sm">
                    시작하기{" "}
                    <span className="ml-1 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleStartPredict(() => {
                      setMode("predict");
                      setStep("input-method");
                    });
                  }}
                  className="group relative bg-slate-50 hover:bg-indigo-50/50 p-8 md:p-10 rounded-2xl border-2 border-slate-200/80 hover:border-indigo-500 transition-all duration-200 text-left cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                      🎯
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      AI 합격 예측
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      목표 대학/학과별 1% 단위 정밀 합격 확률을 분석합니다.
                    </p>
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-xs text-amber-800 leading-normal">
                      ⚠️ 현재 일부 대학의 입시 데이터만 제공되고 있습니다.
                      데이터가 제공되지 않는 대학은 직접 입시결과를 입력하면
                      AI를 통한 합격 가능성 예측이 가능합니다.
                    </div>
                  </div>
                  <div className="mt-8 flex items-center text-indigo-600 font-bold text-sm">
                    예측 시작하기{" "}
                    <span className="ml-1 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* STEP 1: 입력 방식 선택 */}
            {step === "input-method" && (
              <div className="mt-8 max-w-3xl mx-auto text-left">
                <h3 className="text-lg font-bold mb-6 text-center text-slate-700">
                  어떤 방식으로 성적을 입력하시겠습니까?
                </h3>
                <div
                  className={`grid grid-cols-1 ${
                    mode === "analyze" ? "md:grid-cols-2" : "md:grid-cols-3"
                  } gap-4`}
                >
                  <button
                    onClick={() => setStep("upload")}
                    className="p-6 bg-slate-50 border-2 border-slate-200/80 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center cursor-pointer group"
                  >
                    <p className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      📁
                    </p>
                    <p className="font-bold text-slate-800 text-base">
                      나이스 HTML 업로드
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      가장 빠르고 정확한 자동 분석
                    </p>
                  </button>
                  {mode !== "analyze" && (
                    <button
                      onClick={() => setStep("manual-detailed")}
                      className="p-6 bg-slate-50 border-2 border-slate-200/80 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-center cursor-pointer group"
                    >
                      <p className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        ✍️
                      </p>
                      <p className="font-bold text-slate-800 text-base">
                        상세 수동 입력
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        과목별 등급/단위 직접 입력
                      </p>
                    </button>
                  )}
                  {mode === "predict" && (
                    <button
                      onClick={() => setStep("manual-simple")}
                      className="p-6 bg-slate-50 border-2 border-slate-200/80 rounded-2xl hover:border-teal-500 hover:bg-teal-50/50 transition-all text-center cursor-pointer group"
                    >
                      <p className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        ⚡
                      </p>
                      <p className="font-bold text-slate-800 text-base">
                        간편 수동 입력
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        평균 등급만 빠르게 입력
                      </p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1-A: 업로드 */}
            {step === "upload" && (
              <div className="mt-8 max-w-2xl mx-auto">
                <label className="cursor-pointer group flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-500 transition-all shadow-xs mb-6">
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                    📄
                  </span>
                  <span className="font-bold text-indigo-900 text-base">
                    생기부 HTML 파일 선택하기
                  </span>
                  <span className="text-xs text-indigo-600/80 mt-1">
                    .html 또는 .htm 파일만 지원됩니다
                  </span>
                  <input
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                <div className="text-left text-sm text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <p className="font-bold mb-3 text-slate-800 flex items-center gap-1.5 text-base">
                    <span>💡</span> 나이스 생기부 파일 저장 방법 안내
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-xs md:text-sm text-slate-600">
                    <li>
                      PC 크롬(Chrome) 브라우저에서{" "}
                      <strong className="text-slate-800">나이스플러스</strong>{" "}
                      접속 후 로그인합니다.
                    </li>
                    <li>
                      <strong className="text-slate-800">학교생활기록</strong>{" "}
                      메뉴로 들어가{" "}
                      <strong className="text-slate-800">전체선택</strong>을
                      누릅니다.
                    </li>
                    <li>
                      크롬 우측 상단 메뉴(점 3개)에서{" "}
                      <strong className="text-slate-800">
                        '저장 및 공유 &gt; 페이지를 다른 이름으로 저장'
                      </strong>
                      을 클릭합니다.
                    </li>
                    <li>
                      <strong>※ 주의:</strong> 파일 형식을{" "}
                      <strong className="text-indigo-600">
                        ‘웹페이지, 전부(*.htm, *.html)’
                      </strong>
                      로 선택 후 저장해야 정상 인식됩니다.
                    </li>
                  </ol>
                </div>

                {errorMsg && (
                  <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm rounded-xl">
                    ⚠️ {errorMsg}
                  </div>
                )}
              </div>
            )}

            {/* STEP 1-B: 간편 입력 */}
            {step === "manual-simple" && (
              <div className="mt-8 max-w-md mx-auto text-left">
                <label className="block font-bold text-slate-700 mb-2 text-center text-sm">
                  내 평균 등급 입력 (전교과 기준)
                </label>
                <div className="flex flex-col gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="9"
                    placeholder="예: 3.45"
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl font-black text-center text-xl text-slate-800 outline-none focus:border-teal-500 focus:bg-white transition-all"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSimpleGrade(isNaN(val) ? null : val);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (simpleGrade !== null && !isNaN(simpleGrade)) {
                        setStep(
                          mode === "predict"
                            ? "select-university"
                            : "analysis-result"
                        );
                      }
                    }}
                    disabled={simpleGrade === null || isNaN(simpleGrade)}
                    className="force-white-button ui-readable-primary w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition shadow-sm flex items-center justify-center gap-2 text-base cursor-pointer disabled:cursor-not-allowed"
                  >
                    입력 완료 및 진행 →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1-C: 상세 수동 입력 */}
          {step === "manual-detailed" && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8">
              <h2 className="font-extrabold text-2xl mb-6 text-slate-800 flex items-center gap-2">
                <span>✍️</span> 상세 과목 성적 직접 입력
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200/80">
                <select
                  className="ui-readable-select p-3 border border-slate-300 rounded-xl font-bold bg-white text-sm text-slate-900"
                  value={manualInput.grade}
                  onChange={(e) =>
                    setManualInput({
                      ...manualInput,
                      grade: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>1학년</option>
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                </select>
                <select
                  className="ui-readable-select p-3 border border-slate-300 rounded-xl font-bold bg-white text-sm text-slate-900"
                  value={manualInput.semester}
                  onChange={(e) =>
                    setManualInput({
                      ...manualInput,
                      semester: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>1학기</option>
                  <option value={2}>2학기</option>
                </select>
                <select
                  className="ui-readable-select p-3 border border-slate-300 rounded-xl font-bold bg-white text-sm text-slate-900"
                  value={manualInput.type}
                  onChange={(e) =>
                    setManualInput({ ...manualInput, type: e.target.value })
                  }
                >
                  <option value="regular">일반선택</option>
                  <option value="career">진로선택</option>
                </select>
                <input
                  type="text"
                  placeholder="과목명 (예: 수학I)"
                  className="p-3 border border-slate-300 rounded-xl font-bold bg-white text-sm outline-none focus:border-indigo-500"
                  value={manualInput.subject}
                  onChange={(e) =>
                    setManualInput({ ...manualInput, subject: e.target.value })
                  }
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="단위수"
                  className="p-3 border border-slate-300 rounded-xl font-bold bg-white text-sm outline-none focus:border-indigo-500"
                  value={manualInput.credits}
                  onChange={(e) =>
                    setManualInput({
                      ...manualInput,
                      credits: Number(e.target.value),
                    })
                  }
                />
                {manualInput.type === "regular" && (
                  <input
                    type="number"
                    min="1"
                    max="9"
                    placeholder="등급 (1~9)"
                    className="p-3 border border-slate-300 rounded-xl font-bold bg-white text-sm text-indigo-600 outline-none focus:border-indigo-500"
                    value={manualInput.rankGrade}
                    onChange={(e) =>
                      setManualInput({
                        ...manualInput,
                        rankGrade: Number(e.target.value),
                      })
                    }
                  />
                )}
                <button
                  onClick={addManualRecord}
                  className="force-white-button ui-readable-primary col-span-2 md:col-span-6 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition cursor-pointer text-sm shadow-xs"
                >
                  ➕ 과목 추가하기
                </button>
              </div>

              {records.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl gap-3">
                  <span className="font-bold text-indigo-900 text-sm">
                    총{" "}
                    <span className="text-indigo-600 text-base">
                      {records.length}
                    </span>
                    개 과목이 입력되었습니다.
                  </span>
                  <button
                    onClick={() =>
                      setStep(
                        mode === "predict"
                          ? "select-university"
                          : "analysis-result"
                      )
                    }
                    className="force-white-button ui-readable-primary w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition cursor-pointer text-sm shadow-xs"
                  >
                    입력 완료 및 결과 보기 →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: 성적 확인 (HTML 업로드 또는 상세입력) */}
          {step === "preview" && records.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                    <span>✅</span> 파싱된 성적 데이터 확인
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    총 {records.length}개 과목 데이터 분석 완료
                  </p>
                </div>
                <button
                  onClick={() =>
                    setStep(
                      mode === "predict"
                        ? "select-university"
                        : "analysis-result"
                    )
                  }
                  className="force-white-button ui-readable-primary w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-bold transition-all cursor-pointer text-sm shadow-xs"
                >
                  결과 분석하기 →
                </button>
              </div>
              <div className="p-4 max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold text-xs">
                      <th className="p-3 rounded-l-lg">학년/학기</th>
                      <th className="p-3">구분</th>
                      <th className="p-3">과목명</th>
                      <th className="p-3 text-center">단위</th>
                      <th className="p-3 text-center rounded-r-lg">
                        등급/성취도
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-3 text-slate-500 text-xs">
                          {r.grade}학년 {r.semester}학기
                        </td>
                        <td className="p-3 font-semibold text-xs text-indigo-600">
                          {r.tableType === "regular" ? "일반" : "진로/예체"}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {r.subject}
                        </td>
                        <td className="p-3 text-center text-slate-500 text-xs">
                          {r.credits || "-"}
                        </td>
                        <td className="p-3 text-center font-black text-indigo-700">
                          {r.rankGrade || r.achievement || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: 상세 분석 결과 */}
          {step === "analysis-result" && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8">
              <div className="text-center mb-8 border-b border-slate-200 pb-6">
                <h2 className="font-extrabold text-2xl text-slate-900">
                  📊 교과 조합 및 반영 비율별 성적 분석 표
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  대학별 성적 반영 방식에 따른 예상 평균 등급입니다.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse border border-slate-200 rounded-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-indigo-600 text-white text-xs md:text-sm">
                      <th className="p-3.5 font-bold border-r border-indigo-500">
                        교과 조합
                      </th>
                      <th className="p-3.5 font-bold border-r border-indigo-500">
                        전학년 100%
                      </th>
                      <th className="p-3.5 font-bold border-r border-indigo-500">
                        20 / 30 / 50
                      </th>
                      <th className="p-3.5 font-bold border-r border-indigo-500">
                        20 / 40 / 40
                      </th>
                      <th className="p-3.5 font-bold border-r border-indigo-500">
                        20 / 80 (2-3학년)
                      </th>
                      <th className="p-3.5 font-bold">30 / 30 / 40</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {[
                      { name: "국영사", comb: "국영사" },
                      { name: "국영사한", comb: "국영사한" },
                      { name: "국수영사과", comb: "국영수사과" },
                      { name: "국수영사과한", comb: "국영수사과한" },
                      { name: "국수영사", comb: "국영수사" },
                      { name: "국수영사한", comb: "국영수사한" },
                      { name: "국수영과", comb: "국영수과" },
                      { name: "국영", comb: "국영" },
                    ].map((item, idx) => {
                      const comb =
                        item.comb as AnalysisSettings["subjectCombination"];
                      const r100 = calculateAnalysis(records, {
                        subjectCombination: comb,
                        useCredits: true,
                        weightType: "100",
                        customWeights: { g1: 100, g2: 100, g3: 100 },
                      });
                      const r203050 = calculateAnalysis(records, {
                        subjectCombination: comb,
                        useCredits: true,
                        weightType: "custom",
                        customWeights: { g1: 20, g2: 30, g3: 50 },
                      });
                      const r204040 = calculateAnalysis(records, {
                        subjectCombination: comb,
                        useCredits: true,
                        weightType: "custom",
                        customWeights: { g1: 20, g2: 40, g3: 40 },
                      });
                      const r2080 = calculateAnalysis(records, {
                        subjectCombination: comb,
                        useCredits: true,
                        weightType: "custom",
                        customWeights: { g1: 0, g2: 20, g3: 80 },
                      });
                      const r303040 = calculateAnalysis(records, {
                        subjectCombination: comb,
                        useCredits: true,
                        weightType: "custom",
                        customWeights: { g1: 30, g2: 30, g3: 40 },
                      });

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-indigo-50/40 transition-colors"
                        >
                          <td className="p-3.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-900">
                            {item.name}
                          </td>
                          <td className="p-3.5 border-r border-slate-200 font-black text-indigo-600">
                            {r100.overallAverage
                              ? r100.overallAverage.toFixed(2)
                              : "-"}
                          </td>
                          <td className="p-3.5 border-r border-slate-200 font-semibold">
                            {r203050.overallAverage
                              ? r203050.overallAverage.toFixed(2)
                              : "-"}
                          </td>
                          <td className="p-3.5 border-r border-slate-200 font-semibold">
                            {r204040.overallAverage
                              ? r204040.overallAverage.toFixed(2)
                              : "-"}
                          </td>
                          <td className="p-3.5 border-r border-slate-200 font-semibold">
                            {r2080.overallAverage
                              ? r2080.overallAverage.toFixed(2)
                              : "-"}
                          </td>
                          <td className="p-3.5 font-semibold">
                            {r303040.overallAverage
                              ? r303040.overallAverage.toFixed(2)
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    handleStartPredict(() => {
                      setMode("predict");
                      setStep("select-university");
                    });
                  }}
                  className="force-white-button ui-readable-primary bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-sm transition-all cursor-pointer text-base"
                >
                  이 성적으로 AI 합격 예측하기 →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4-A: 생기부 심층 분석 평가 */}
          {step === "bio-assessment" &&
            selectedDept &&
            selectedAdmission?.category === "종합" && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-7">
                <div className="text-center border-b border-slate-200 pb-6">
                  <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 px-4 py-1.5 rounded-full text-xs font-bold mb-3">
                    📝 DEEP RECORD ANALYSIS
                  </div>
                  <h2 className="font-extrabold text-2xl text-slate-900">
                    생기부를 포함하여 Ai 합격 예측하기
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedUniv?.name} · {selectedDept.name} ·{" "}
                    {selectedAdmission.name}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed">
                  <p className="font-extrabold">
                    ⚠️ 실제 대학의 학생부종합평가를 재현하는 기능이 아닙니다.
                    해당 기능은 정확도가 매우 낮습니다.
                  </p>
                  <p className="mt-1">
                    나이스 HTML의 전범위 기록과 아래의 참고 평가를 함께 사용하여
                    Ai가 합격예측을 소폭 보정합니다.
                  </p>
                </div>

                <div
                  className="rounded-2xl border border-violet-200 bg-violet-50 p-5"
                  style={{ color: "#334155" }}
                >
                  <h3 className="text-sm font-extrabold text-violet-900">
                    📝 셀프 평가란?
                  </h3>
                  <p className="text-xs text-violet-800 mt-2 leading-relaxed">
                    생기부를 직접 읽어본 뒤 본인의 강점 수준을 스스로 판단하는
                    참고 평가입니다. 실제 대학의 등급이나 평가점수가 아니며,
                    아래 기준을 참고해 가장 가깝다고 생각하는 등급을 선택하세요.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-[11px]">
                    <div className="bg-white rounded-xl border border-violet-100 p-3">
                      <b className="text-slate-900">학업역량</b>
                      <br />
                      <span className="text-slate-600">
                        교과 성취, 학습 과정, 탐구·문제해결의 수준
                      </span>
                    </div>
                    <div className="bg-white rounded-xl border border-violet-100 p-3">
                      <b className="text-slate-900">진로역량</b>
                      <br />
                      <span className="text-slate-600">
                        희망 전공과의 연계, 탐구의 깊이·지속성
                      </span>
                    </div>
                    <div className="bg-white rounded-xl border border-violet-100 p-3">
                      <b className="text-slate-900">공동체역량</b>
                      <br />
                      <span className="text-slate-600">
                        협력, 책임, 역할, 소통, 봉사·리더십
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-violet-700 mt-3 font-semibold">
                    A+가 가장 높고 E가 가장 낮습니다. 모르는 경우에는
                    과대평가하기보다 보수적으로 선택하는 것을 권장합니다.
                  </p>
                </div>

                <div className="space-y-5">
                  {(
                    [
                      [
                        "academic",
                        "학업역량",
                        "사용자가 판단한 교과 성취·학업 지속성·수업 속 탐구·학습 과정에 대한 셀프 평가",
                      ],
                      [
                        "career",
                        "진로역량",
                        "사용자가 판단한 희망 전공 연계성·활동의 깊이·지속성·후속 활동에 대한 셀프 평가",
                      ],
                      [
                        "community",
                        "공동체역량",
                        "사용자가 판단한 협력·책임·역할 수행·소통·봉사·리더십 등에 대한 셀프 평가",
                      ],
                    ] as const
                  ).map(([key, label, description]) => {
                    const value = bioRatings[key];
                    return (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900">
                              {label}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {description}
                            </p>
                          </div>
                          <div
                            className="text-2xl font-black text-violet-600 shrink-0"
                            style={{ color: "#6d28d9" }}
                          >
                            {value == null ? "선택" : value}
                          </div>
                        </div>
                        <select
                          className="ui-readable-select w-full sm:max-w-xs bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 font-extrabold text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 cursor-pointer"
                          value={value ?? ""}
                          onChange={(e) =>
                            setBioRatings((prev) => ({
                              ...prev,
                              [key]: (e.target.value ||
                                null) as BioGrade | null,
                            }))
                          }
                          style={{
                            color: "#0f172a",
                            backgroundColor: "#ffffff",
                            WebkitTextFillColor: "#0f172a",
                          }}
                        >
                          <option
                            value=""
                            style={{
                              color: "#64748b",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            평가를 선택하세요
                          </option>
                          {BIO_GRADE_OPTIONS.map((grade) => (
                            <option
                              key={grade}
                              value={grade}
                              style={{
                                color: "#0f172a",
                                backgroundColor: "#ffffff",
                              }}
                            >
                              {grade}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-2">
                          A+가 가장 높고 E가 가장 낮은 셀프 평가입니다.
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        ⚖️ 합격예측 반영 비율
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        기본값은 40 / 40 / 20이며, 프리셋으로 간단히 변경할 수
                        있습니다. 대학별 반영 비율은 다 다르니 대학별 모집요강을
                        확인해주세요.
                      </p>
                    </div>
                    <span className="text-sm font-black text-indigo-700">
                      {bioWeights.academic +
                        bioWeights.career +
                        bioWeights.community}
                      %
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { a: 40, c: 40, m: 20, label: "기본 40 / 40 / 20" },
                      { a: 30, c: 40, m: 30, label: "30 / 40 / 30" },
                      { a: 40, c: 30, m: 30, label: "40 / 30 / 30" },
                      { a: 50, c: 30, m: 20, label: "50 / 30 / 20" },
                    ].map((preset) => {
                      const active =
                        bioWeights.academic === preset.a &&
                        bioWeights.career === preset.c &&
                        bioWeights.community === preset.m;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setBioWeights({
                              academic: preset.a,
                              career: preset.c,
                              community: preset.m,
                            })
                          }
                          className={`px-3 py-2 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                            active
                              ? "bg-indigo-600 border-indigo-600 text-white force-white-button"
                              : "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                          }`}
                          style={{
                            color: active ? "#ffffff" : "#4338ca",
                            backgroundColor: active ? "#4f46e5" : "#ffffff",
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        ["academic", "학업역량"],
                        ["career", "진로역량"],
                        ["community", "공동체역량"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="rounded-xl bg-white border border-indigo-100 p-3"
                        style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                      >
                        <span
                          className="block text-xs font-extrabold text-slate-700 mb-2"
                          style={{ color: "#334155" }}
                        >
                          {label} 반영비율
                        </span>
                        <select
                          className="ui-readable-select w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                          value={bioWeights[key]}
                          onChange={(e) =>
                            setBioWeights((prev) => ({
                              ...prev,
                              [key]: Number(e.target.value),
                            }))
                          }
                          style={{
                            color: "#0f172a",
                            backgroundColor: "#ffffff",
                            WebkitTextFillColor: "#0f172a",
                          }}
                        >
                          {Array.from({ length: 21 }, (_, i) => i * 5).map(
                            (v) => (
                              <option
                                key={v}
                                value={v}
                                style={{
                                  color: "#0f172a",
                                  backgroundColor: "#ffffff",
                                }}
                              >
                                {v}%
                              </option>
                            )
                          )}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("select-university")}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={
                      bioRatings.academic == null ||
                      bioRatings.career == null ||
                      bioRatings.community == null ||
                      bioWeights.academic +
                        bioWeights.career +
                        bioWeights.community !==
                        100
                    }
                    onClick={handleRunDeepBioAnalysis}
                    className="bio-action-confirm force-white-button ui-readable-primary w-2/3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold py-4 rounded-2xl transition cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      color: "#ffffff",
                      WebkitTextFillColor: "#ffffff",
                      backgroundColor: "#7c3aed",
                    }}
                  >
                    <span
                      style={{
                        color: "#ffffff",
                        WebkitTextFillColor: "#ffffff",
                      }}
                    >
                      다음 → 생기부 평가하기
                    </span>
                  </button>
                </div>
              </div>
            )}

          {/* STEP 4-B: 생기부 평가 결과 */}
          {step === "bio-result" &&
            selectedDept &&
            selectedAdmission?.category === "종합" &&
            analyzeRecordBook && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-7">
                <div className="text-center border-b border-slate-200 pb-6">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold mb-3">
                    ✓ RECORD ANALYSIS COMPLETE
                  </div>
                  <h2 className="font-extrabold text-2xl text-slate-900">
                    생기부 평가 결과 beta
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedUniv?.name} · {selectedDept.name} ·{" "}
                    {selectedAdmission.name}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed">
                  <p className="font-extrabold">
                    ⚠️ 실제 대학 평가가 아닌 참고용 자동 분석입니다.
                  </p>
                  <p className="mt-1">
                    생기부 전범위 기록과 선택한 평가값을 규칙 기반으로 종합해
                    산출했으며, 실제 대학의 학생부종합평가를 재현하지 않습니다.
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-violet-900">
                        📊 셀프 평가 · AI 평가 · 최종 평가
                      </h3>
                      <p className="text-xs text-violet-800 mt-1">
                        셀프 평가는 사용자의 자기평가, AI 평가는 업로드한
                        생기부의 활동·출결·전공 연계 근거를 자동 분석해 산출하는
                        참고평가입니다. 두 결과를 함께 반영해 최종 참고평가를
                        계산합니다.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      [
                        "학업역량",
                        analyzeRecordBook.selfGradeLabels.academic,
                        analyzeRecordBook.autoGradeLabels.academic,
                        analyzeRecordBook.gradeLabels.academic,
                      ],
                      [
                        "진로역량",
                        analyzeRecordBook.selfGradeLabels.career,
                        analyzeRecordBook.autoGradeLabels.career,
                        analyzeRecordBook.gradeLabels.career,
                      ],
                      [
                        "공동체역량",
                        analyzeRecordBook.selfGradeLabels.community,
                        analyzeRecordBook.autoGradeLabels.community,
                        analyzeRecordBook.gradeLabels.community,
                      ],
                    ].map(([label, selfGrade, autoGrade, finalGrade]) => (
                      <div
                        key={label as string}
                        className="rounded-2xl border border-violet-100 bg-white p-4"
                        style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                      >
                        <p
                          className="text-xs font-extrabold text-slate-700"
                          style={{ color: "#334155" }}
                        >
                          {label}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5 mt-3 text-center">
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                            <p className="text-[9px] font-bold text-slate-500">
                              셀프
                            </p>
                            <p
                              className="text-base font-black text-slate-900"
                              style={{ color: "#0f172a" }}
                            >
                              {selfGrade}
                            </p>
                          </div>
                          <div className="rounded-xl bg-blue-50 border border-blue-100 p-2">
                            <p className="text-[9px] font-bold text-blue-700">
                              AI 평가
                            </p>
                            <p
                              className="text-base font-black text-blue-900"
                              style={{ color: "#1e3a8a" }}
                            >
                              {autoGrade}
                            </p>
                          </div>
                          <div className="rounded-xl bg-violet-100 border border-violet-200 p-2">
                            <p className="text-[9px] font-bold text-violet-700">
                              최종
                            </p>
                            <p
                              className="text-base font-black text-violet-900"
                              style={{ color: "#5b21b6" }}
                            >
                              {finalGrade}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-4 rounded-xl bg-white border border-violet-100 p-3"
                    style={{ color: "#334155", backgroundColor: "#ffffff" }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-extrabold text-slate-700"
                        style={{ color: "#334155" }}
                      >
                        최종 종합평가
                      </span>
                      <span
                        className="text-xl font-black text-violet-700"
                        style={{ color: "#5b21b6" }}
                      >
                        {analyzeRecordBook.gradeLabels.total} ·{" "}
                        {analyzeRecordBook.scores.total}점
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    ["출결", analyzeRecordBook.coverage.sections.attendance],
                    ["교과·세특", analyzeRecordBook.coverage.sections.academic],
                    ["창체", analyzeRecordBook.coverage.sections.creative],
                    ["독서", analyzeRecordBook.coverage.sections.reading],
                    ["행동특성", analyzeRecordBook.coverage.sections.behavior],
                    ["수상", analyzeRecordBook.coverage.sections.awards],
                  ].map(([label, active]) => (
                    <div
                      key={label as string}
                      className="rounded-xl border p-3 text-center"
                      style={{
                        color: active ? "#065f46" : "#64748b",
                        backgroundColor: active ? "#ecfdf5" : "#f8fafc",
                        borderColor: active ? "#a7f3d0" : "#e2e8f0",
                      }}
                    >
                      <p className="text-[11px] font-extrabold">{label}</p>
                      <p className="text-[10px] mt-1">
                        {active ? "확인됨" : "미확인"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[
                    [
                      "학업 근거",
                      analyzeRecordBook.signalCounts.academic,
                      analyzeRecordBook.detailedComments.academic,
                      "#1d4ed8",
                      "#eff6ff",
                      "#bfdbfe",
                    ],
                    [
                      "진로 근거",
                      analyzeRecordBook.signalCounts.career,
                      analyzeRecordBook.detailedComments.career,
                      "#6d28d9",
                      "#f5f3ff",
                      "#ddd6fe",
                    ],
                    [
                      "공동체 근거",
                      analyzeRecordBook.signalCounts.community,
                      analyzeRecordBook.detailedComments.community,
                      "#047857",
                      "#ecfdf5",
                      "#a7f3d0",
                    ],
                  ].map(
                    ([
                      title,
                      count,
                      comment,
                      textColor,
                      bgColor,
                      borderColor,
                    ]) => (
                      <div
                        key={title as string}
                        className="rounded-2xl border p-5"
                        style={{
                          color: "#0f172a",
                          backgroundColor: bgColor as string,
                          borderColor: borderColor as string,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3
                            className="text-sm font-extrabold"
                            style={{ color: textColor as string }}
                          >
                            {title}
                          </h3>
                          <span
                            className="text-lg font-black"
                            style={{ color: textColor as string }}
                          >
                            {count}건
                          </span>
                        </div>
                        <p
                          className="text-xs text-slate-700 mt-3 leading-relaxed"
                          style={{ color: "#334155" }}
                        >
                          {comment}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {analyzeRecordBook.evidenceSnippets.length > 0 && (
                  <div
                    className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5"
                    style={{ color: "#0f172a" }}
                  >
                    <h3 className="text-sm font-extrabold text-cyan-900">
                      📌 전공 연계 활동 근거
                    </h3>
                    <p className="text-xs text-cyan-800 mt-1 mb-3">
                      전공 키워드와 탐구·보고서·프로젝트 등의 활동 문맥이 함께
                      확인된 일부 문장입니다.
                    </p>
                    <div className="space-y-2">
                      {analyzeRecordBook.evidenceSnippets.map((snippet, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-white border border-cyan-100 px-3 py-2.5 text-xs text-slate-700 leading-relaxed"
                          style={{
                            color: "#334155",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          {snippet}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <h3 className="text-sm font-extrabold text-emerald-900 mb-3">
                      💪 강점
                    </h3>
                    <ul className="space-y-2">
                      {analyzeRecordBook.strengths.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-emerald-900 leading-relaxed"
                        >
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <h3 className="text-sm font-extrabold text-amber-900 mb-3">
                      🛠 보완점
                    </h3>
                    <ul className="space-y-2">
                      {analyzeRecordBook.improvements.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-amber-900 leading-relaxed"
                        >
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-violet-900">
                        🎯 전공 연계성
                      </h3>
                      <p className="text-xs text-violet-800 mt-1">
                        {selectedDept.name} 기준 자동 분석
                      </p>
                    </div>
                    <span className="text-3xl font-black text-violet-700">
                      {analyzeRecordBook.linkage}
                    </span>
                  </div>
                  <p className="text-sm text-violet-900 mt-3 leading-relaxed">
                    {analyzeRecordBook.linkageComment}
                  </p>
                  {analyzeRecordBook.matchedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {analyzeRecordBook.matchedKeywords
                        .slice(0, 8)
                        .map((word) => (
                          <span
                            key={word}
                            className="px-2.5 py-1 rounded-full bg-white border border-violet-200 text-xs font-bold text-violet-700"
                            style={{
                              color: "#5b21b6",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            {word}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    🗓 출결 참고 분석
                  </h3>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    결석 {analyzeRecordBook.attendance.absent}회 · 지각{" "}
                    {analyzeRecordBook.attendance.late}회 · 조퇴{" "}
                    {analyzeRecordBook.attendance.early}회 · 미인정{" "}
                    {analyzeRecordBook.attendance.unauthorized}회
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                  <p className="text-sm font-extrabold text-indigo-900">
                    종합평가
                  </p>
                  <p className="text-sm text-indigo-900 mt-2 leading-relaxed">
                    {analyzeRecordBook.summary}
                  </p>
                  <p className="text-xs text-indigo-700 mt-3 font-semibold">
                    합격예측에는 생기부 점수와 전공 연계성을 최대 ±13%p
                    수준으로만 제한적으로 반영합니다.
                  </p>
                </div>

                {(() => {
                  const base = getPrediction(
                    parseFloat(adigaGrade || "0"),
                    selectedAdmission?.cutoffs,
                    "종합"
                  );
                  const adjustment = Math.max(
                    -13,
                    Math.min(
                      13,
                      Math.round(
                        (analyzeRecordBook.scores.total - 75) * 0.16 +
                          (analyzeRecordBook.linkage - 65) * 0.055
                      )
                    )
                  );
                  const finalChance = Math.min(
                    99,
                    Math.max(1, base.chance + adjustment)
                  );
                  const finalText =
                    finalChance >= 90
                      ? "과도하향"
                      : finalChance >= 75
                      ? "하향"
                      : finalChance >= 60
                      ? "안정"
                      : finalChance >= 45
                      ? "적정"
                      : finalChance >= 25
                      ? "소신"
                      : finalChance >= 10
                      ? "상향(도전)"
                      : "우주상향";
                  const reasons: string[] = [];
                  if (analyzeRecordBook.scores.total < 75)
                    reasons.push(
                      `생기부 최종 참고평가가 ${analyzeRecordBook.scores.total}점으로 기준점(75점)보다 낮아 보정되었습니다.`
                    );
                  if (analyzeRecordBook.linkage < 65)
                    reasons.push(
                      `선택 학과와의 전공 연계성이 ${analyzeRecordBook.linkage}점으로 분석되어 보정되었습니다.`
                    );
                  if (analyzeRecordBook.attendance.unauthorized > 0)
                    reasons.push(
                      `미인정 출결 ${analyzeRecordBook.attendance.unauthorized}회가 확인되어 출결 측면의 보완 신호가 반영되었습니다.`
                    );
                  if (reasons.length === 0 && adjustment > 0)
                    reasons.push(
                      "생기부 종합평가와 전공 연계성이 기준보다 높아 소폭 상향 보정되었습니다."
                    );
                  if (reasons.length === 0)
                    reasons.push(
                      "생기부 평가가 기준 범위와 가까워 합격예측 보정이 크지 않았습니다."
                    );
                  return (
                    <div
                      className="rounded-3xl border border-sky-200 bg-gradient-to-br from-white via-sky-50 to-blue-100/70 p-5 md:p-6 shadow-lg shadow-sky-100/60"
                      style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-xs font-extrabold text-sky-700">
                            AI 생기부 포함 최종 합격예측
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            입결 기반 예측에 생기부 참고 보정을 제한적으로 적용
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                          보정 {adjustment > 0 ? "+" : ""}
                          {adjustment}%p
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white border border-slate-200 p-5 text-center shadow-sm">
                          <p className="text-[11px] font-extrabold text-slate-500 tracking-wide">
                            최종 지원판단
                          </p>
                          <p
                            className="text-2xl md:text-3xl font-black text-slate-900 mt-1"
                            style={{ color: "#0f172a" }}
                          >
                            {finalText}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-sky-200 border border-sky-300 p-5 text-center shadow-md">
                          <p className="text-[11px] font-extrabold text-sky-800 tracking-wide">
                            생기부 포함 예상 합격 확률
                          </p>
                          <p
                            className="text-3xl md:text-4xl font-black text-sky-900 mt-1"
                            style={{ color: "#0c4a6e" }}
                          >
                            {finalChance}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                        <p className="text-xs font-extrabold text-indigo-900">
                          📌 예상 결과
                        </p>
                        <p className="text-sm font-bold text-indigo-900 mt-1">
                          {base.outcomeText}
                        </p>
                        {base.interviewFlipText && (
                          <p className="text-xs sm:text-sm font-semibold text-violet-800 mt-2 leading-relaxed">
                            🎤 {base.interviewFlipText}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-extrabold text-amber-900">
                          📌 보정 이유
                        </p>
                        <ul className="mt-2 space-y-1">
                          {reasons.map((r, i) => (
                            <li
                              key={i}
                              className="text-xs text-amber-900 leading-relaxed"
                            >
                              • {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-left">
                        <p className="text-xs font-extrabold text-rose-800">
                          ⚠️ 생기부 반영 신뢰도 안내
                        </p>
                        <p className="text-[11px] text-rose-700 mt-1.5 leading-relaxed">
                          생기부 반영값은 생기부 기록을 바탕으로 한 참고용 자동
                          분석입니다. 실제 대학의 학생부종합평가 방식이나
                          평가위원의 판단을 재현하지 않기 때문에 신뢰도가
                          제한적입니다. 따라서 입결 기반 합격예측보다 신뢰도가
                          낮으며, 생기부만으로 합격 가능성을 판단해서는 안
                          됩니다. 최대 ±13%p까지 보정될 수 있으나 실제
                          합격확률이 그만큼 변한다는 의미는 아닙니다. 최종 지원
                          판단은 대학의 최신 모집요강과 공식 입시자료를 함께
                          확인하세요.
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                        참고용 자동 예측이며 실제 대학의 평가·합격 결과를
                        보장하지 않습니다. 생기부 보정은 최대 ±13%p로
                        제한됩니다.
                      </p>
                    </div>
                  );
                })()}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("bio-assessment")}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition cursor-pointer"
                  >
                    다시 선택
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("select-university")}
                    className="bio-action-confirm force-white-button ui-readable-primary w-2/3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-4 rounded-2xl transition cursor-pointer shadow-sm"
                    style={{
                      color: "#ffffff",
                      WebkitTextFillColor: "#ffffff",
                      backgroundColor: "#7c3aed",
                    }}
                  >
                    <span
                      style={{
                        color: "#ffffff",
                        WebkitTextFillColor: "#ffffff",
                      }}
                    >
                      생기부 포함 합격예측 보기 →
                    </span>
                  </button>
                </div>
              </div>
            )}

          {/* STEP 4: 목표 대학/전형 선택 및 합격 예측 */}
          {step === "select-university" && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
                <div>
                  <h2 className="font-extrabold text-2xl text-slate-900 flex items-center gap-2">
                    <span>🎯</span> 목표 대학 및 학과 선택
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    합격 가능성을 진단할 대학을 선택하세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUnivModal(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-bold shadow-xs transition cursor-pointer text-xs sm:text-sm self-start sm:self-auto"
                >
                  <span>➕</span> 타 대학/학과 직접 추가하기
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    대학/캠퍼스 선택
                  </label>
                  <select
                    className="ui-readable-select w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none text-sm text-slate-900"
                    value={selectedUnivId}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW") {
                        setShowAddUnivModal(true);
                        return;
                      }
                      setSelectedUnivId(e.target.value);
                      setSelectedDeptId("");
                      setSelectedAdmissionId("");
                      setBioAnalyzedTargetKey(null);
                      setBioRatings({
                        academic: null,
                        career: null,
                        community: null,
                      });
                    }}
                  >
                    {univDatabase.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.campus})
                      </option>
                    ))}
                    <option
                      value="ADD_NEW"
                      className="text-indigo-600 font-bold"
                    >
                      ➕ 대학 직접 입력하여 추가...
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    학과 선택
                  </label>
                  <select
                    className="ui-readable-select w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none text-sm text-slate-900"
                    value={selectedDeptId}
                    onChange={(e) => {
                      setSelectedDeptId(e.target.value);
                      setSelectedAdmissionId("");
                      setBioAnalyzedTargetKey(null);
                      setBioRatings({
                        academic: null,
                        career: null,
                        community: null,
                      });
                    }}
                  >
                    <option value="">-- 학과를 선택하세요 --</option>
                    {selectedUniv?.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    전형 선택
                  </label>
                  <select
                    className="ui-readable-select w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none disabled:opacity-40 text-sm text-slate-900"
                    value={selectedAdmissionId}
                    onChange={(e) => handleAdmissionChange(e.target.value)}
                    disabled={!selectedDeptId}
                  >
                    <option value="">-- 전형을 선택하세요 --</option>
                    {selectedDept?.admissions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 교과 전형 산출 환산등급 가이드 멘트 */}
              {selectedAdmission?.category === "교과" && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm font-semibold flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="font-extrabold text-amber-900 mb-0.5">
                      산출 환산등급 확인 방법 안내
                    </p>
                    <p className="text-amber-800 font-normal leading-relaxed">
                      어디가 접속 ➔ 대학별 성적 분석 ➔ 대학 선택 후 2026학년도
                      내 환산등급 확인 ➔ 아래 입력창에 입력
                    </p>
                  </div>
                </div>
              )}

              {/* 예측 결과창 */}
              {selectedAdmission && (
                <div
                  className="mt-8 rounded-3xl p-6 md:p-8 shadow-xl"
                  style={{
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                  }}
                >
                  <div className="flex flex-col md:flex-row md:flex-wrap gap-8 items-stretch">
                    {/* 왼쪽: 지원 성적 입력 + 전년도 입결 */}
                    <div className="w-full md:w-[calc(50%-1rem)] space-y-5 flex flex-col justify-between md:order-1">
                      <div>
                        <h3 className="font-extrabold text-xl text-indigo-300 mb-4 flex items-center gap-2">
                          <span>📝</span> 내 지원 성적 입력
                        </h3>

                        {selectedAdmission.category === "종합" ? (
                          <div
                            className="text-xs sm:text-sm p-4 rounded-2xl border leading-relaxed"
                            style={{
                              backgroundColor: "#1e293b",
                              borderColor: "#334155",
                              color: "#cbd5e1",
                            }}
                          >
                            ✨ 종합전형은 환산성적 입력 없이 전교과 평균 내신(
                            <span className="text-indigo-400 font-bold">
                              {allSubjectAvg ? allSubjectAvg.toFixed(2) : "-"}
                            </span>
                            등급)으로 즉시 비교합니다.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400">
                              대학별 환산 등급 (교과)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              max="9"
                              value={adigaGrade}
                              onChange={(e) => setAdigaGrade(e.target.value)}
                              placeholder="환산등급 입력 (예: 3.45)"
                              className="px-4 py-3 rounded-xl w-full font-bold outline-none focus:border-indigo-500 text-base"
                              style={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                color: "#f8fafc",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* 입결 데이터 비교 표 */}
                      {selectedAdmission.cutoffs && (
                        <div
                          className="p-5 rounded-2xl border space-y-3"
                          style={{
                            backgroundColor: "#1e293b",
                            borderColor: "#334155",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                              전년도 입시 결과 데이터
                            </p>
                            <span className="text-xs font-black text-slate-300">
                              FINAL
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-center">
                            <div
                              className="p-3 rounded-xl border"
                              style={{
                                backgroundColor: "#0f172a",
                                borderColor: "#475569",
                              }}
                            >
                              <span className="text-xs text-slate-400 block mb-1">
                                50% 컷 (최종등록자)
                              </span>
                              <span className="text-lg font-black text-emerald-400">
                                {selectedAdmission.cutoffs.finalPass50CutGrade
                                  ? `${selectedAdmission.cutoffs.finalPass50CutGrade.toFixed(
                                      2
                                    )}등급`
                                  : "-"}
                              </span>
                            </div>

                            <div
                              className="p-3 rounded-xl border"
                              style={{
                                backgroundColor: "#0f172a",
                                borderColor: "#475569",
                              }}
                            >
                              <span className="text-xs text-slate-400 block mb-1">
                                {selectedAdmission.cutoffs.secondCutPercent ??
                                  75}
                                % 컷 (최종등록자)
                              </span>
                              <span className="text-lg font-black text-teal-400">
                                {selectedAdmission.cutoffs.finalPass75CutGrade
                                  ? `${selectedAdmission.cutoffs.finalPass75CutGrade.toFixed(
                                      2
                                    )}등급`
                                  : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {mode === "predict" &&
                      selectedAdmission.category === "종합" && (
                        <div className="w-full md:w-[calc(50%-1rem)] space-y-4 md:order-3 md:ml-auto">
                          <div className="w-full p-5 rounded-2xl border bg-violet-50 border-violet-200">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-black text-violet-600 uppercase tracking-wider">
                                  DEEP RECORD ANALYSIS
                                </p>
                                <p className="text-base font-extrabold text-slate-900 mt-1">
                                  생기부를 포함하여 더 심층 분석하기
                                </p>
                                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                  나이스 HTML 전체 기록을 바탕으로 별도 심층
                                  평가를 진행한 뒤, 그 결과를 종합전형 예측에
                                  제한적으로 반영합니다.
                                </p>
                              </div>
                              <span
                                className="bio-reference-badge shrink-0 px-2.5 py-1 rounded-full bg-white border border-violet-200 text-[10px] font-black"
                                style={{
                                  color: "#6d28d9",
                                  WebkitTextFillColor: "#6d28d9",
                                }}
                              >
                                beta
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={!recordBookHtml}
                              onClick={handleStartBioAnalysis}
                              className="bio-deep-start w-full mt-4 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold py-4 rounded-2xl transition cursor-pointer disabled:cursor-not-allowed shadow-sm"
                              style={{
                                color: "#ffffff",
                                WebkitTextFillColor: "#ffffff",
                              }}
                            >
                              <span
                                style={{
                                  color: "rgb(255,255,255)",
                                  WebkitTextFillColor: "rgb(255,255,255)",
                                  opacity: 1,
                                }}
                              >
                                {recordBookHtml
                                  ? "📝 생기부를 포함하여 더 심층 분석하기 →"
                                  : "나이스 HTML 업로드 후 이용 가능"}
                              </span>
                            </button>
                            <p className="text-[11px] text-slate-500 text-center mt-2">
                              교과전형에서는 제공되지 않으며, 종합전형에서만
                              사용할 수 있습니다.
                            </p>
                          </div>

                          {bioAnalyzedTargetKey ===
                            `${selectedUnivId}|${selectedDeptId}|${selectedAdmissionId}` &&
                            analyzeRecordBook && (
                              <div className="w-full p-5 rounded-2xl border border-emerald-200 bg-emerald-50">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                  <p className="text-sm font-extrabold text-emerald-900">
                                    ✅ 생기부 심층 분석 반영 완료
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleStartBioAnalysis}
                                    className="text-[11px] font-bold text-violet-700 hover:underline"
                                  >
                                    다시 평가
                                  </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                  {[
                                    ["학업", analyzeRecordBook.scores.academic],
                                    ["진로", analyzeRecordBook.scores.career],
                                    [
                                      "공동체",
                                      analyzeRecordBook.scores.community,
                                    ],
                                    ["연계성", analyzeRecordBook.linkage],
                                  ].map(([label, score]) => (
                                    <div
                                      key={label as string}
                                      className="rounded-xl bg-white border border-emerald-100 py-2.5"
                                      style={{
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff",
                                      }}
                                    >
                                      <p className="text-[10px] font-bold text-slate-500">
                                        {label}
                                      </p>
                                      <p
                                        className="text-lg font-black text-slate-900 mt-0.5"
                                        style={{ color: "#0f172a" }}
                                      >
                                        {score}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[11px] text-emerald-800 font-semibold mt-3 leading-relaxed">
                                  생기부 분석은 합격예측에 최대 ±13%p 수준으로만
                                  제한적으로 반영됩니다. 단, 생기부 기반 자동
                                  분석은 신뢰도가 제한적입니다.
                                </p>
                              </div>
                            )}
                        </div>
                      )}

                    {mode === "predict" && (
                      <>
                        {" "}
                        {/* 오른쪽: AI 예측 결과 */}
                        <div className="w-full md:w-[calc(50%-1rem)] flex items-center justify-center md:order-2">
                          {adigaGrade && selectedAdmission.cutoffs ? (
                            (() => {
                              const basePred = getPrediction(
                                parseFloat(adigaGrade),
                                selectedAdmission.cutoffs,
                                selectedAdmission.category
                              );
                              const currentBioTargetKey = `${selectedUnivId}|${selectedDeptId}|${selectedAdmissionId}`;
                              const bioAdjustment =
                                selectedAdmission.category === "종합" &&
                                bioAnalyzedTargetKey === currentBioTargetKey &&
                                analyzeRecordBook
                                  ? Math.max(
                                      -13,
                                      Math.min(
                                        13,
                                        Math.round(
                                          (analyzeRecordBook.scores.total -
                                            75) *
                                            0.16 +
                                            (analyzeRecordBook.linkage - 65) *
                                              0.055
                                        )
                                      )
                                    )
                                  : 0;
                              const pred = {
                                ...basePred,
                                chance: Math.min(
                                  99,
                                  Math.max(1, basePred.chance + bioAdjustment)
                                ),
                              };

                              return (
                                <div
                                  className="w-full p-6 rounded-2xl border text-center space-y-4"
                                  style={{
                                    backgroundColor: "#1e293b",
                                    borderColor: "#334155",
                                  }}
                                >
                                  <div
                                    className="border-b pb-3"
                                    style={{ borderColor: "#334155" }}
                                  >
                                    <p className="text-indigo-300 text-xs font-bold mb-1 uppercase tracking-wider">
                                      TARGET DEPARTMENT
                                    </p>
                                    <p
                                      className="text-slate-100 text-lg font-black"
                                      style={{ color: "#f8fafc" }}
                                    >
                                      {selectedDept?.name}{" "}
                                      <span
                                        className="text-xs font-normal text-slate-400"
                                        style={{ color: "#94a3b8" }}
                                      >
                                        ({selectedAdmission.name})
                                      </span>
                                    </p>
                                  </div>

                                  <div
                                    className={`${pred.bg} p-6 rounded-2xl border text-center relative overflow-hidden transition-all`}
                                  >
                                    <p
                                      className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1"
                                      style={{ color: "#cbd5e1" }}
                                    >
                                      AI 정밀 합격 예측 결과
                                    </p>

                                    <p className="text-3xl sm:text-4xl font-black tracking-tight my-2">
                                      {pred.text}
                                    </p>

                                    {/* 정밀 합격 확률 프로그레스 바 */}
                                    <div className="my-4">
                                      <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span>예상 합격 확률</span>
                                        <span
                                          className="text-sm font-black"
                                          style={{ color: "#f8fafc" }}
                                        >
                                          {pred.chance}%
                                        </span>
                                      </div>

                                      <AnimatedProbabilityBar
                                        key={`${selectedUnivId}-${selectedDeptId}-${selectedAdmissionId}-${adigaGrade}-${
                                          selectedAdmission?.name ?? ""
                                        }-${pred.text}-${pred.chance}`}
                                        chance={pred.chance}
                                        barColor={pred.barColor}
                                        animationKey={`${selectedUnivId}-${selectedDeptId}-${selectedAdmissionId}-${adigaGrade}-${
                                          selectedAdmission?.name ?? ""
                                        }-${pred.text}-${pred.chance}`}
                                      />
                                    </div>

                                    <p className="text-sm sm:text-base font-black leading-relaxed text-white">
                                      {pred.outcomeText}
                                    </p>

                                    <p className="text-xs sm:text-sm font-semibold opacity-90 leading-relaxed">
                                      {pred.msg}
                                    </p>

                                    {pred.interviewFlipText && (
                                      <div className="mt-3 p-3 rounded-xl border border-violet-400/30 bg-violet-950/30 text-xs sm:text-sm font-bold text-violet-200 leading-relaxed">
                                        🎤 {pred.interviewFlipText}
                                      </div>
                                    )}

                                    {pred.diffText !== "-" && (
                                      <p className="text-xs mt-3 opacity-70 font-mono">
                                        ({pred.diffLabel}: {pred.diffText})
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div
                              className="w-full h-full min-h-[220px] flex items-center justify-center border-2 border-dashed rounded-2xl p-8"
                              style={{
                                borderColor: "#334155",
                                backgroundColor: "#1e293b",
                              }}
                            >
                              <p className="text-slate-400 font-bold text-center text-sm leading-relaxed">
                                성적을 입력하시면
                                <br />
                                1% 단위 AI 정밀 합격 예측 결과가 산출됩니다.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ⚠️ AI 합격예측 서비스 이용 안내 (면책 문구) 모달 */}
        {showDisclaimerModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] flex flex-col justify-between"
              style={{ color: "#0f172a" }}
            >
              <div>
                <div className="flex items-center gap-2 mb-4 text-amber-600">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    AI 합격예측 서비스 이용 안내
                  </h3>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[320px] overflow-y-auto space-y-3 font-normal">
                  <p>
                    본 서비스에서 제공하는 AI 합격예측 결과는 입력된 성적 및
                    입시 데이터를 바탕으로 AI가 분석한 참고용 예측 정보입니다.
                  </p>
                  <p>
                    AI의 분석 결과는 실제 합격 여부를 보장하지 않으며, 대학별
                    전형방법, 모집인원, 경쟁률, 지원자 분포, 대학별 평가기준 및
                    기타 입시환경의 변화에 따라 실제 결과와 차이가 발생할 수
                    있습니다.
                  </p>
                  <p>
                    특히 AI가 모든 입시 변수를 정확하게 반영하거나 미래의 입시
                    결과를 확정적으로 예측할 수 있는 것은 아닙니다.
                  </p>
                  <p>
                    따라서 본 서비스의 결과는 지원 전략을 참고하기 위한 자료로만
                    활용하시기 바라며, 최종적인 지원 여부와 입시 관련 결정은 각
                    대학의 최신 모집요강 및 공식 입시자료를 확인하여 이용자
                    본인이 판단하시기 바랍니다.
                  </p>
                  <p className="font-bold text-slate-900">
                    본 서비스의 AI 분석 결과를 이용하여 발생한 합격·불합격 등의
                    입시 결과에 대해 서비스 제공자는 이를 보장하거나 책임지지
                    않습니다.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disclaimerChecked}
                    onChange={(e) => setDisclaimerChecked(e.target.checked)}
                    className="w-4 h-4 rounded-sm accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                    위 면책 안내 사항을 모두 확인하였으며 이에 동의합니다.
                  </span>
                </label>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDisclaimerModal(false)}
                  className="ui-readable-secondary w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition text-sm cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={!disclaimerChecked}
                  onClick={handleConfirmDisclaimer}
                  className="force-white-button ui-readable-primary w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition shadow-sm text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  동의하고 진행하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📝 생기부 분석 이용 안내 모달 */}
        {showBioDisclaimerModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] flex flex-col justify-between"
              style={{ color: "#0f172a" }}
            >
              <div>
                <div className="flex items-center gap-2 mb-4 text-violet-600">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    생기부 자동 분석 이용 안내
                  </h3>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5">
                  <p>
                    1. 이 기능은 외부 AI나 대학의 실제 평가 시스템을 사용하지
                    않는 Ai 규칙 기반 자동 분석입니다.
                  </p>
                  <p>
                    2. 업로드한 나이스 HTML에 포함된 생기부 전범위 텍스트를
                    기준으로 분석합니다.
                  </p>
                  <p>
                    3. 학업역량·진로역량·공동체역량과 출결 및 전공 연계성을
                    참고용 점수로 산출합니다.
                  </p>
                  <p>
                    4. 선택한 대학·학과의 실제 평가기준이나 평가위원의 판단을
                    그대로 재현하지 않습니다.
                  </p>
                  <p>
                    5. 분석 점수와 합격예측 보정값은 참고용이며 실제 합격
                    가능성을 보장하지 않습니다.
                  </p>
                  <p>
                    6. 생기부 문구의 표현·HTML 구조에 따라 일부 항목이 잘못
                    인식될 수 있습니다.
                  </p>
                  <p>
                    7. 종합전형의 실제 평가는 대학별 전형요소와 평가방법에 따라
                    달라질 수 있습니다.
                  </p>
                  <p className="font-extrabold text-slate-900">
                    8. 아래 안내를 확인하고 동의한 경우에만 생기부 분석 결과를
                    확인할 수 있습니다.
                  </p>
                </div>
                <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bioDisclaimerChecked}
                    onChange={(e) => setBioDisclaimerChecked(e.target.checked)}
                    className="w-4 h-4 rounded-sm accent-violet-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                    위 안내를 모두 확인하였으며 참고용 분석에 동의합니다.
                  </span>
                </label>
              </div>
              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBioDisclaimerModal(false)}
                  className="ui-readable-secondary w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition text-sm cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={!bioDisclaimerChecked}
                  onClick={handleConfirmBioDisclaimer}
                  className="bio-disclaimer-confirm w-2/3 rounded-xl font-bold py-3.5 text-sm cursor-pointer"
                  style={{
                    background: "#ede9fe",
                    color: "#4c1d95",
                    WebkitTextFillColor: "#4c1d95",
                    border: "2px solid #8b5cf6",
                    opacity: 1,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      color: "#4c1d95",
                      WebkitTextFillColor: "#4c1d95",
                      opacity: 1,
                      fontWeight: 800,
                    }}
                  >
                    동의하고 분석하기
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 직접 대학 추가 모달 */}
        {showAddUnivModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowAddUnivModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
                ➕ 대학 / 입결 데이터 추가
              </h3>
              <p className="text-slate-500 text-xs mb-6">
                진단받고 싶은 대학의 입결(50%컷, 70/75%컷)을 직접 등록하세요.
              </p>

              <form
                onSubmit={handleAddNewUniversity}
                className="space-y-4 text-left"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      대학교 이름 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 서울대학교"
                      value={customUnivInput.univName}
                      onChange={(e) =>
                        setCustomUnivInput({
                          ...customUnivInput,
                          univName: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      캠퍼스
                    </label>
                    <input
                      type="text"
                      placeholder="예: 관악 / 본교"
                      value={customUnivInput.campus}
                      onChange={(e) =>
                        setCustomUnivInput({
                          ...customUnivInput,
                          campus: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    학과 이름 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 경영학과"
                    value={customUnivInput.deptName}
                    onChange={(e) =>
                      setCustomUnivInput({
                        ...customUnivInput,
                        deptName: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      전형명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 지역균형전형"
                      value={customUnivInput.admissionName}
                      onChange={(e) =>
                        setCustomUnivInput({
                          ...customUnivInput,
                          admissionName: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      전형 유형
                    </label>
                    <select
                      value={customUnivInput.category}
                      onChange={(e) =>
                        setCustomUnivInput({
                          ...customUnivInput,
                          category: e.target.value as "교과" | "종합",
                        })
                      }
                      className="ui-readable-select w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="교과">교과전형</option>
                      <option value="종합">종합전형</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      50% 컷 등급
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="예: 2.15"
                      value={customUnivInput.cut50}
                      onChange={(e) =>
                        setCustomUnivInput({
                          ...customUnivInput,
                          cut50: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      70/75% 컷 등급
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="예: 2.30"
                      value={customUnivInput.cut75}
                      onChange={(e) =>
                        setCustomUnivInput({
                          ...customUnivInput,
                          cut75: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUnivModal(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-sm cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-xs text-sm cursor-pointer"
                  >
                    등록 및 바로 선택
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
