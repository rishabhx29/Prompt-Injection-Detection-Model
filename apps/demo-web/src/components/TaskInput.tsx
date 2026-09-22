import React from 'react';
import { Target, RotateCcw } from 'lucide-react';
import { DoubleBezelCard } from './common/DoubleBezelCard';

interface TaskInputProps {
  task: string;
  defaultTask: string;
  onChange: (newTask: string) => void;
  disabled?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  task,
  defaultTask,
  onChange,
  disabled
}) => {
  const isCustomized = task !== defaultTask;

  return (
    <DoubleBezelCard
      headerLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} color="#818cf8" />
          <span>User's Original Task</span>
        </div>
      }
      headerRight={
        isCustomized ? (
          <button
            onClick={() => onChange(defaultTask)}
            disabled={disabled}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={12} />
            <span>Reset task</span>
          </button>
        ) : undefined
      }
      innerStyle={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}
    >
      <textarea
        value={task}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Enter user goal for LLM agent..."
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-sans)',
          resize: 'none',
          outline: 'none',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          transition: 'border-color 0.2s ease'
        }}
      />
    </DoubleBezelCard>
  );
};

export default TaskInput;
