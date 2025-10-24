import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-md dark:shadow-black/20 border border-gray-200/80 dark:border-slate-700 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;