/**
 * Enhanced Fall Risk Intervention System
 * Provides personalized, evidence-based interventions to reduce fall risk
 */

import {
  AdvancedFallRiskPrediction,
  FallPreventionIntervention,
} from './advanced-fall-risk-engine';

export interface UserProfile {
  age: number;
  mobility: 'independent' | 'assisted' | 'limited';
  livingSituation: 'alone' | 'with_family' | 'assisted_living';
  medicalConditions: string[];
  currentActivity: 'sedentary' | 'light' | 'moderate' | 'active';
  preferences: PersonalizedInterventionPlan['preferences'];
}

export interface InterventionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority: number;
}

export interface InterventionProgram {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: string; // "4 weeks", "ongoing", etc.
  frequency: string; // "daily", "3x per week", etc.
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  interventions: FallPreventionIntervention[];
  progressTracking: ProgressMetric[];
  milestones: ProgramMilestone[];
  expectedOutcomes: string[];
  riskReduction: number; // Estimated % risk reduction
}

export interface ProgressMetric {
  id: string;
  name: string;
  unit: string;
  targetValue?: number;
  currentValue?: number;
  history: { date: string; value: number }[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface ProgramMilestone {
  id: string;
  name: string;
  description: string;
  targetWeek: number;
  completed: boolean;
  completedDate?: Date;
  requirements: string[];
}

export interface InterventionProgress {
  interventionId: string;
  startDate: Date;
  lastActive: Date;
  completionRate: number; // 0-100%
  adherenceRate: number; // 0-100%
  effectiveness: number; // Measured improvement 0-100%
  userRating: number; // 1-5 stars
  notes: string[];
  challenges: string[];
  modifications: string[];
}

export interface PersonalizedInterventionPlan {
  id: string;
  userId: string;
  createdDate: Date;
  lastUpdated: Date;

  // Risk assessment
  baselineRisk: number;
  currentRisk: number;
  targetRisk: number;

  // Active interventions
  activeInterventions: FallPreventionIntervention[];
  completedInterventions: FallPreventionIntervention[];
  progress: InterventionProgress[];

  // Program enrollment
  enrolledPrograms: InterventionProgram[];

  // Personalization
  preferences: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'flexible';
    intensity: 'low' | 'moderate' | 'high';
    duration: 'short' | 'medium' | 'long';
    location: 'home' | 'gym' | 'outdoor' | 'mixed';
    equipment: string[];
    limitations: string[];
  };

  // Monitoring
  nextReview: Date;
  riskTrend: 'improving' | 'stable' | 'worsening';
  adherenceAlerts: boolean;
  progressReports: boolean;
}

/**
 * Enhanced Fall Risk Intervention Engine
 * Generates and manages personalized intervention plans
 */
export class EnhancedInterventionEngine {
  private readonly interventionCategories: InterventionCategory[] = [
    {
      id: 'exercise',
      name: 'Exercise & Fitness',
      description:
        'Physical activities to improve strength, balance, and mobility',
      icon: 'dumbbell',
      priority: 1,
    },
    {
      id: 'home-safety',
      name: 'Home Safety',
      description: 'Environmental modifications to reduce fall hazards',
      icon: 'home',
      priority: 2,
    },
    {
      id: 'medical',
      name: 'Medical Management',
      description: 'Healthcare interventions and medication reviews',
      icon: 'stethoscope',
      priority: 3,
    },
    {
      id: 'technology',
      name: 'Assistive Technology',
      description: 'Devices and apps to enhance safety and mobility',
      icon: 'smartphone',
      priority: 4,
    },
    {
      id: 'behavioral',
      name: 'Behavioral Change',
      description: 'Lifestyle modifications and habit formation',
      icon: 'brain',
      priority: 5,
    },
  ];

  private readonly evidenceBasedInterventions: FallPreventionIntervention[] = [
    // Exercise interventions
    {
      id: 'balance-training',
      type: 'exercise',
      priority: 'high',
      title: 'Progressive Balance Training',
      description:
        'Structured balance exercises to improve postural control and stability',
      instructions: [
        'Start with single-leg standing for 30 seconds',
        'Progress to eyes-closed balance challenges',
        'Add unstable surfaces (foam pad, balance board)',
        'Include dynamic balance movements',
        'Practice reaction training exercises',
      ],
      expectedOutcome:
        'Improved balance confidence and 25-40% reduction in fall risk',
      timeframe: '6-8 weeks',
      evidence: 'strong',
      riskReduction: 35,
      effort: 'moderate',
      cost: 'low',
    },
    {
      id: 'strength-training',
      type: 'exercise',
      priority: 'high',
      title: 'Lower Body Strength Training',
      description: 'Progressive resistance training for leg and hip muscles',
      instructions: [
        'Perform squats and sit-to-stand exercises',
        'Include calf raises and heel raises',
        'Add resistance band exercises',
        'Progress to single-leg exercises',
        'Focus on functional movements',
      ],
      expectedOutcome: 'Increased muscle strength and power, improved mobility',
      timeframe: '8-12 weeks',
      evidence: 'strong',
      riskReduction: 30,
      effort: 'moderate',
      cost: 'low',
    },
    {
      id: 'tai-chi',
      type: 'exercise',
      priority: 'moderate',
      title: 'Tai Chi for Fall Prevention',
      description:
        'Modified Tai Chi program designed specifically for fall prevention',
      instructions: [
        'Learn 8-form simplified Tai Chi routine',
        'Practice weight shifting and stepping',
        'Focus on slow, controlled movements',
        'Include breathing and mindfulness components',
        'Join group classes for social support',
      ],
      expectedOutcome: 'Enhanced balance, flexibility, and fall confidence',
      timeframe: '12-16 weeks',
      evidence: 'strong',
      riskReduction: 45,
      effort: 'low',
      cost: 'moderate',
    },

    // Home safety interventions
    {
      id: 'home-assessment',
      type: 'environmental',
      priority: 'urgent',
      title: 'Professional Home Safety Assessment',
      description:
        'Comprehensive evaluation of home environment for fall hazards',
      instructions: [
        'Schedule assessment with occupational therapist',
        'Identify and document all potential hazards',
        'Prioritize modifications by risk and feasibility',
        'Create implementation timeline',
        'Plan follow-up assessment',
      ],
      expectedOutcome: 'Safer home environment with reduced fall hazards',
      timeframe: '2-4 weeks',
      evidence: 'strong',
      riskReduction: 25,
      effort: 'low',
      cost: 'moderate',
    },
    {
      id: 'bathroom-safety',
      type: 'environmental',
      priority: 'high',
      title: 'Bathroom Safety Modifications',
      description: 'Install safety equipment in high-risk bathroom areas',
      instructions: [
        'Install grab bars near toilet and in shower',
        'Add non-slip mats in tub and shower floor',
        'Ensure adequate lighting with motion sensors',
        'Consider raised toilet seat if needed',
        'Remove or secure loose rugs',
      ],
      expectedOutcome: 'Significantly reduced bathroom fall risk',
      timeframe: '1-2 weeks',
      evidence: 'moderate',
      riskReduction: 40,
      effort: 'moderate',
      cost: 'moderate',
    },

    // Medical interventions
    {
      id: 'medication-review',
      type: 'medical',
      priority: 'urgent',
      title: 'Comprehensive Medication Review',
      description:
        'Professional review of all medications for fall risk factors',
      instructions: [
        'Schedule appointment with pharmacist or physician',
        'Bring all current medications and supplements',
        'Discuss side effects and interactions',
        'Consider timing and dosage adjustments',
        'Explore alternatives for high-risk medications',
      ],
      expectedOutcome: 'Optimized medication regimen with reduced fall risk',
      timeframe: '1-2 weeks',
      evidence: 'strong',
      riskReduction: 20,
      effort: 'low',
      cost: 'low',
    },
    {
      id: 'vision-screening',
      type: 'medical',
      priority: 'high',
      title: 'Comprehensive Vision Assessment',
      description: 'Professional eye examination and vision correction',
      instructions: [
        'Schedule comprehensive eye exam',
        'Update prescription glasses if needed',
        'Consider multifocal lens adjustments',
        'Assess depth perception and contrast sensitivity',
        'Discuss lighting needs and recommendations',
      ],
      expectedOutcome: 'Improved vision and reduced visual fall risk factors',
      timeframe: '2-4 weeks',
      evidence: 'moderate',
      riskReduction: 15,
      effort: 'low',
      cost: 'moderate',
    },

    // Technology interventions
    {
      id: 'fall-detection-device',
      type: 'technology',
      priority: 'moderate',
      title: 'Personal Fall Detection System',
      description:
        'Wearable device with automatic fall detection and emergency response',
      instructions: [
        'Research and select appropriate device',
        'Set up emergency contacts and response plan',
        'Practice using panic button and features',
        'Ensure device is worn consistently',
        'Test system monthly with monitoring service',
      ],
      expectedOutcome:
        'Faster emergency response and increased safety confidence',
      timeframe: '1 week setup',
      evidence: 'moderate',
      riskReduction: 10,
      effort: 'low',
      cost: 'high',
    },

    // Behavioral interventions
    {
      id: 'fall-education',
      type: 'behavioral',
      priority: 'moderate',
      title: 'Fall Prevention Education Program',
      description:
        'Comprehensive education about fall risks and prevention strategies',
      instructions: [
        'Attend fall prevention workshop or class',
        'Learn about personal risk factors',
        'Practice safe movement techniques',
        'Develop action plan for high-risk situations',
        'Share knowledge with family members',
      ],
      expectedOutcome: 'Increased awareness and adoption of safe behaviors',
      timeframe: '4-6 weeks',
      evidence: 'moderate',
      riskReduction: 15,
      effort: 'low',
      cost: 'low',
    },
  ];

  /**
   * Generate personalized intervention plan based on fall risk assessment
   */
  generatePersonalizedPlan(
    riskAssessment: AdvancedFallRiskPrediction,
    userProfile: UserProfile
  ): PersonalizedInterventionPlan {
    const plan: PersonalizedInterventionPlan = {
      id: `plan-${Date.now()}`,
      userId: 'current-user', // Would come from auth context
      createdDate: new Date(),
      lastUpdated: new Date(),
      baselineRisk: riskAssessment.riskScore,
      currentRisk: riskAssessment.riskScore,
      targetRisk: Math.max(20, riskAssessment.riskScore * 0.6), // Target 40% reduction
      activeInterventions: [],
      completedInterventions: [],
      progress: [],
      enrolledPrograms: [],
      preferences: userProfile.preferences,
      nextReview: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      riskTrend: 'stable',
      adherenceAlerts: true,
      progressReports: true,
    };

    // Select interventions based on risk factors and user profile
    plan.activeInterventions = this.selectInterventions(
      riskAssessment,
      userProfile
    );

    // Assign to programs
    plan.enrolledPrograms = this.selectPrograms(
      plan.activeInterventions,
      userProfile
    );

    return plan;
  }

  /**
   * Select appropriate interventions based on risk assessment and user profile
   */
  private selectInterventions(
    riskAssessment: AdvancedFallRiskPrediction,
    userProfile: UserProfile
  ): FallPreventionIntervention[] {
    const selectedInterventions: FallPreventionIntervention[] = [];

    // Always include high-priority interventions for high-risk users
    if (riskAssessment.riskScore > 60) {
      selectedInterventions.push(
        this.evidenceBasedInterventions.find(
          (i) => i.id === 'balance-training'
        )!,
        this.evidenceBasedInterventions.find(
          (i) => i.id === 'medication-review'
        )!,
        this.evidenceBasedInterventions.find((i) => i.id === 'home-assessment')!
      );
    }

    // Add gait-specific interventions
    if (riskAssessment.gaitRisk.overallScore > 50) {
      selectedInterventions.push(
        this.evidenceBasedInterventions.find(
          (i) => i.id === 'strength-training'
        )!
      );
    }

    // Add balance-specific interventions
    if (riskAssessment.balanceRisk.overallScore > 50) {
      selectedInterventions.push(
        this.evidenceBasedInterventions.find((i) => i.id === 'tai-chi')!
      );
    }

    // Add environmental interventions
    if (riskAssessment.environmentalRisk.overallScore > 40) {
      selectedInterventions.push(
        this.evidenceBasedInterventions.find((i) => i.id === 'bathroom-safety')!
      );
    }

    // Add medical interventions based on risk factors
    if (
      riskAssessment.primaryRiskFactors.some(
        (f) => f.category === 'physiological'
      )
    ) {
      selectedInterventions.push(
        this.evidenceBasedInterventions.find(
          (i) => i.id === 'vision-screening'
        )!
      );
    }

    // Add technology interventions for appropriate users
    if (
      userProfile.livingSituation === 'alone' &&
      riskAssessment.riskScore > 70
    ) {
      selectedInterventions.push(
        this.evidenceBasedInterventions.find(
          (i) => i.id === 'fall-detection-device'
        )!
      );
    }

    // Always include education
    selectedInterventions.push(
      this.evidenceBasedInterventions.find((i) => i.id === 'fall-education')!
    );

    // Filter out null values and sort by priority
    return selectedInterventions.filter(Boolean).sort((a, b) => {
      const priorities: Record<string, number> = {
        immediate: 5,
        urgent: 4,
        high: 3,
        moderate: 2,
        low: 1,
      };
      return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
    });
  }

  /**
   * Select appropriate programs based on interventions and user profile
   */
  private selectPrograms(
    interventions: FallPreventionIntervention[],
    userProfile: UserProfile
  ): InterventionProgram[] {
    const programs: InterventionProgram[] = [];

    // Create exercise program if multiple exercise interventions
    const exerciseInterventions = interventions.filter(
      (i) => i.type === 'exercise'
    );
    if (exerciseInterventions.length >= 2) {
      programs.push({
        id: 'comprehensive-exercise-program',
        name: 'Comprehensive Fall Prevention Exercise Program',
        description:
          'Integrated exercise program combining balance, strength, and flexibility training',
        category: 'exercise',
        duration: '12 weeks',
        frequency: '3x per week',
        difficulty:
          userProfile.currentActivity === 'sedentary'
            ? 'beginner'
            : 'intermediate',
        equipment: ['resistance bands', 'foam pad', 'chair'],
        interventions: exerciseInterventions,
        progressTracking: [
          {
            id: 'balance-time',
            name: 'Single-leg stand time',
            unit: 'seconds',
            targetValue: 30,
            currentValue: 10,
            history: [],
            trend: 'stable',
          },
          {
            id: 'strength-reps',
            name: 'Chair rise repetitions',
            unit: 'reps',
            targetValue: 15,
            currentValue: 8,
            history: [],
            trend: 'stable',
          },
        ],
        milestones: [
          {
            id: 'week2-assessment',
            name: 'Initial Progress Assessment',
            description: 'Complete baseline fitness assessment',
            targetWeek: 2,
            completed: false,
            requirements: ['Complete all exercises', 'Log progress daily'],
          },
          {
            id: 'week6-progression',
            name: 'Mid-program Progression',
            description: 'Advance to intermediate level exercises',
            targetWeek: 6,
            completed: false,
            requirements: [
              'Demonstrate proper form',
              'Meet performance targets',
            ],
          },
        ],
        expectedOutcomes: [
          'Improved balance and stability',
          'Increased lower body strength',
          'Enhanced confidence in movement',
          '30-50% reduction in fall risk',
        ],
        riskReduction: 40,
      });
    }

    return programs;
  }

  /**
   * Update intervention progress
   */
  updateProgress(
    planId: string,
    interventionId: string,
    progressData: Partial<InterventionProgress>
  ): void {
    // Implementation would update the stored plan
    console.log(
      `Updating progress for plan ${planId}, intervention ${interventionId}:`,
      progressData
    );
  }

  /**
   * Generate progress report
   */
  generateProgressReport(plan: PersonalizedInterventionPlan): {
    overallProgress: number;
    riskReduction: number;
    completedInterventions: number;
    adherenceRate: number;
    recommendations: string[];
    nextSteps: string[];
  } {
    const totalInterventions =
      plan.activeInterventions.length + plan.completedInterventions.length;
    const completedCount = plan.completedInterventions.length;
    const overallProgress =
      totalInterventions > 0 ? (completedCount / totalInterventions) * 100 : 0;

    const riskReduction = Math.max(0, plan.baselineRisk - plan.currentRisk);

    const adherenceRates = plan.progress.map((p) => p.adherenceRate);
    const adherenceRate =
      adherenceRates.length > 0
        ? adherenceRates.reduce((sum, rate) => sum + rate, 0) /
          adherenceRates.length
        : 0;

    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    // Generate recommendations based on progress
    if (adherenceRate < 70) {
      recommendations.push(
        'Focus on improving adherence to current interventions'
      );
      nextSteps.push('Review barriers and adjust intervention schedule');
    }

    if (riskReduction < 10) {
      recommendations.push('Consider adding more intensive interventions');
      nextSteps.push('Schedule reassessment and plan adjustment');
    }

    if (overallProgress > 80) {
      recommendations.push(
        'Excellent progress! Consider advancing to maintenance phase'
      );
      nextSteps.push('Develop long-term maintenance plan');
    }

    return {
      overallProgress,
      riskReduction,
      completedInterventions: completedCount,
      adherenceRate,
      recommendations,
      nextSteps,
    };
  }

  /**
   * Get intervention categories
   */
  getInterventionCategories(): InterventionCategory[] {
    return this.interventionCategories;
  }

  /**
   * Get all available interventions
   */
  getAvailableInterventions(): FallPreventionIntervention[] {
    return this.evidenceBasedInterventions;
  }

  /**
   * Get interventions by category
   */
  getInterventionsByCategory(categoryId: string): FallPreventionIntervention[] {
    return this.evidenceBasedInterventions.filter((intervention) => {
      const category = this.interventionCategories.find(
        (cat) => cat.id === categoryId
      );
      return (
        category && intervention.type === this.mapCategoryToType(categoryId)
      );
    });
  }

  private mapCategoryToType(
    categoryId: string
  ): FallPreventionIntervention['type'] {
    const mapping: Record<string, FallPreventionIntervention['type']> = {
      exercise: 'exercise',
      'home-safety': 'environmental',
      medical: 'medical',
      technology: 'technology',
      behavioral: 'behavioral',
    };
    return mapping[categoryId] || 'behavioral';
  }
}
