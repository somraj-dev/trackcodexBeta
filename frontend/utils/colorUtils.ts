/**
 * Generates a consistent, aesthetic color from a string (e.g., userId).
 */
export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
        '#7C6CF2', // Purple
        '#5B8DEF', // Blue
        '#F58BD7', // Pink
        '#F4C84B', // Yellow
        '#FF5B7F', // Red/Pink
        '#31B56A', // Green
        '#A78BFA', // Violet
        '#60A5FA', // Sky
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};
