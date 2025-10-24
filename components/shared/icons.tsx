import React from 'react';

interface IconProps {
  className?: string;
  title?: string;
}

const IconWrapper: React.FC<React.PropsWithChildren<IconProps>> = ({ children, className = 'w-6 h-6', title }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden={!title}
    role={title ? 'img' : undefined}
  >
    {title && <title>{title}</title>}
    {children}
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </IconWrapper>
);

export const AlertTriangleIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props} className={props.className || 'w-5 h-5'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </IconWrapper>
);

export const PencilSquareIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </IconWrapper>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </IconWrapper>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.71c-1.126 0-2.036.954-2.036 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </IconWrapper>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </IconWrapper>
);

export const DocumentDuplicateIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m9.75 0h-3.25a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125h3.25c.621 0 1.125.504 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125z" />
  </IconWrapper>
);

export const ClipboardDocumentCheckIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-1.125 0-2.25 1.125-2.25 2.25v12c0 1.125 1.125 2.25 2.25 2.25h9c1.125 0 2.25-1.125 2.25-2.25v-5.25M9 14.25l2.25 2.25 4.5-4.5m0-7.5h-4.5" />
    </IconWrapper>
);

export const TableIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h-1.5m1.5 0h1.5m14.25 0h1.5m-1.5 0h-1.5m-11.25 0v-4.5A1.125 1.125 0 016.75 13.5h10.5c.621 0 1.125.504 1.125 1.125v4.5m-11.25 0h11.25m-11.25 0a1.125 1.125 0 01-1.125-1.125v-7.5c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v7.5c0 .621-.504 1.125-1.125 1.125h-1.5zm11.25 0a1.125 1.125 0 001.125-1.125v-7.5c0-.621-.504-1.125-1.125-1.125h-1.5a1.125 1.125 0 00-1.125 1.125v7.5c0 .621.504 1.125 1.125 1.125h1.5z" />
    </IconWrapper>
);

export const GridIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </IconWrapper>
);

export const SectionsIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </IconWrapper>
);

export const ChatBubbleLeftIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </IconWrapper>
);

export const SlidersIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </IconWrapper>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props} className={props.className || 'w-5 h-5'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </IconWrapper>
);

export const UserGroupIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.625 15.75a16.037 16.037 0 012.625-3.375m0 0a16.037 16.037 0 013.375 2.625m-3.375-2.625a16.037 16.037 0 01-2.625 3.375m3.375-2.625c-.625 1.033-1.32 1.87-2.175 2.625m14.85-10.499a4.875 4.875 0 00-6.89 0c-1.913 1.913-1.913 5.021 0 6.934a4.875 4.875 0 006.89 0c1.913-1.913 1.913-5.021 0-6.934zM12 12.75a3.375 3.375 0 110-6.75 3.375 3.375 0 010 6.75z" />
    </IconWrapper>
);

export const ChevronUpDownIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </IconWrapper>
);

export const CheckBadgeIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props} className={props.className || 'w-5 h-5'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
);

export const CrownIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props} className={props.className || 'w-6 h-6'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A3.75 3.75 0 0112 3.75c-1.32 0-2.5.7-3.138 1.755A3.752 3.752 0 004.5 9.75c0 .355.05.7.144 1.033M19.5 9.75c0 .355-.05.7-.144 1.033m-14.712 0A3.733 3.733 0 003 12.75c0 1.32.7 2.5 1.755 3.138A3.752 3.752 0 008.25 21c.355 0 .7-.05 1.033-.144m1.829-10.117a3.733 3.733 0 013.708 0M12 12.75a3.75 3.75 0 003.75-3.75M12 12.75a3.75 3.75 0 01-3.75-3.75M12 21a3.75 3.75 0 003.75-3.75M12 21a3.75 3.75 0 01-3.75-3.75M15.75 15.862A3.752 3.752 0 0121 12.75c0-1.32-.7-2.5-1.755-3.138A3.752 3.752 0 0015.75 5.25c-.355 0-.7.05-1.033.144" />
    </IconWrapper>
);

export const InformationCircleIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </IconWrapper>
);

export const XMarkIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </IconWrapper>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </IconWrapper>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <IconWrapper {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </IconWrapper>
);