
import React from 'react';
import { EWasteItem } from '../types';

interface DataSafetyGuideProps {
  item: EWasteItem;
}

const DataSafetyGuide: React.FC<DataSafetyGuideProps> = ({ item }) => {
  const steps = [
    'Backup your important data to the cloud or an external drive.',
    'Perform a full factory reset to erase all personal information.',
    'Remove any SIM cards or external memory cards (SD cards).',
    'Sign out of all accounts, including your Apple ID / Google Account.',
  ];

  return (
    <div className="mt-4 border-t border-green-200/80 pt-3">
        <details className="group">
            <summary className="cursor-pointer list-none flex justify-between items-center font-medium text-green-700">
                Important: Data Safety Checklist
                <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
            </summary>
            <p className="text-xs mt-2 text-gray-600">Before recycling your {item.category}, follow these steps to protect your data:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
                {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                ))}
            </ul>
        </details>
    </div>
  );
};

export default DataSafetyGuide;
