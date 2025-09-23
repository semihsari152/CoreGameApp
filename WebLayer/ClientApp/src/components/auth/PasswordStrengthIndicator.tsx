import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'En az 8 karakter',
    test: (password) => password.length >= 8
  },
  {
    id: 'lowercase',
    label: 'En az bir küçük harf (a-z)',
    test: (password) => /[a-z]/.test(password)
  },
  {
    id: 'uppercase',
    label: 'En az bir büyük harf (A-Z)',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    id: 'number',
    label: 'En az bir rakam (0-9)',
    test: (password) => /\d/.test(password)
  },
  {
    id: 'special',
    label: 'En az bir özel karakter (!@#$%^&*)',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const getPasswordStrength = () => {
    const passedRequirements = requirements.filter(req => req.test(password));
    return {
      score: passedRequirements.length,
      total: requirements.length,
      percentage: (passedRequirements.length / requirements.length) * 100
    };
  };

  const strength = getPasswordStrength();

  const getStrengthColor = () => {
    if (strength.percentage < 40) return 'bg-red-500';
    if (strength.percentage < 60) return 'bg-yellow-500';
    if (strength.percentage < 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength.percentage < 40) return 'Zayıf';
    if (strength.percentage < 60) return 'Orta';
    if (strength.percentage < 80) return 'İyi';
    return 'Güçlü';
  };

  if (!password) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Şifre Gücü
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStrengthText()}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength.percentage}%` }}
        ></div>
      </div>

      {/* Requirements List */}
      <div className="space-y-1">
        {requirements.map((requirement) => {
          const passed = requirement.test(password);
          return (
            <div key={requirement.id} className="flex items-center text-sm">
              {passed ? (
                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              )}
              <span className={passed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                {requirement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;