export default function ApplicationLogo(props) {
    return (
        <svg {...props} viewBox="0 0 316 316" xmlns="http://www.w3.org/2000/svg">
            <path d="M158 40C89.72 40 34 88.97 34 149.5C34 181.32 48.63 210.15 72.5 231.08V276L114.87 253.61C127.45 257.23 140.93 259.5 155 259.5H158C226.28 259.5 282 210.53 282 150C282 89.47 226.28 40 158 40Z" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="16" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"/>
            <circle cx="110" cy="150" r="12" fill="currentColor"/>
            <circle cx="158" cy="150" r="12" fill="currentColor"/>
            <circle cx="206" cy="150" r="12" fill="currentColor"/>
        </svg>
    );
}