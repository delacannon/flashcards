export interface Pattern {
  id: string;
  name: string;
  getCSS: (color: string) => React.CSSProperties;
  preview: (color: string) => React.CSSProperties;
}

export const patterns: Pattern[] = [
  {
    id: 'none',
    name: 'None',
    getCSS: () => ({}),
    preview: () => ({}),
  },
  {
    id: 'dots',
    name: 'Dots',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)`,
      backgroundSize: '10px 10px',
    }),
  },
  {
    id: 'diagonal-lines',
    name: 'Diagonal',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(0,0,0,0.05) 10px,
        rgba(0,0,0,0.05) 20px
      )`,
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 5px,
        rgba(0,0,0,0.08) 5px,
        rgba(0,0,0,0.08) 10px
      )`,
    }),
  },
  {
    id: 'grid',
    name: 'Grid',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
      `,
      backgroundSize: '10px 10px',
    }),
  },
  {
    id: 'polka',
    name: 'Polka',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        radial-gradient(circle at 10px 10px, rgba(0,0,0,0.08) 2px, transparent 2px),
        radial-gradient(circle at 30px 30px, rgba(0,0,0,0.08) 2px, transparent 2px)
      `,
      backgroundSize: '40px 40px',
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        radial-gradient(circle at 5px 5px, rgba(0,0,0,0.12) 1px, transparent 1px),
        radial-gradient(circle at 15px 15px, rgba(0,0,0,0.12) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    }),
  },
  {
    id: 'boxes',
    name: 'Boxes',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.05) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.05) 75%)
      `,
      backgroundSize: '30px 30px',
      backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px',
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        linear-gradient(45deg, rgba(0,0,0,0.08) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(0,0,0,0.08) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.08) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.08) 75%)
      `,
      backgroundSize: '15px 15px',
      backgroundPosition: '0 0, 0 7.5px, 7.5px -7.5px, -7.5px 0px',
    }),
  },
  {
    id: 'horizontal-lines',
    name: 'H-Lines',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 10px,
        rgba(0,0,0,0.05) 10px,
        rgba(0,0,0,0.05) 20px
      )`,
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 5px,
        rgba(0,0,0,0.08) 5px,
        rgba(0,0,0,0.08) 10px
      )`,
    }),
  },
  {
    id: 'vertical-lines',
    name: 'V-Lines',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(
        90deg,
        transparent,
        transparent 10px,
        rgba(0,0,0,0.05) 10px,
        rgba(0,0,0,0.05) 20px
      )`,
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(
        90deg,
        transparent,
        transparent 5px,
        rgba(0,0,0,0.08) 5px,
        rgba(0,0,0,0.08) 10px
      )`,
    }),
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        linear-gradient(135deg, rgba(0,0,0,0.05) 25%, transparent 25%),
        linear-gradient(225deg, rgba(0,0,0,0.05) 25%, transparent 25%),
        linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%),
        linear-gradient(315deg, rgba(0,0,0,0.05) 25%, transparent 25%)
      `,
      backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
      backgroundSize: '20px 20px',
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        linear-gradient(135deg, rgba(0,0,0,0.08) 25%, transparent 25%),
        linear-gradient(225deg, rgba(0,0,0,0.08) 25%, transparent 25%),
        linear-gradient(45deg, rgba(0,0,0,0.08) 25%, transparent 25%),
        linear-gradient(315deg, rgba(0,0,0,0.08) 25%, transparent 25%)
      `,
      backgroundPosition: '5px 0, 5px 0, 0 0, 0 0',
      backgroundSize: '10px 10px',
    }),
  },
  {
    id: 'waves',
    name: 'Waves',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-radial-gradient(
        circle at 0 0,
        transparent 0,
        ${color} 10px,
        transparent 10px,
        transparent 20px,
        ${color} 20px,
        ${color} 30px,
        transparent 30px,
        transparent 40px
      ),
      repeating-radial-gradient(
        circle at 100% 100%,
        transparent 0,
        ${color} 10px,
        transparent 10px,
        transparent 20px,
        ${color} 20px,
        ${color} 30px,
        transparent 30px,
        transparent 40px
      )`,
      backgroundSize: '80px 80px',
      backgroundPosition: '0 0, 40px 40px',
      opacity: 0.9,
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-radial-gradient(
        circle at 0 0,
        transparent 0,
        rgba(0,0,0,0.05) 5px,
        transparent 5px,
        transparent 10px
      )`,
      backgroundSize: '20px 20px',
    }),
  },
  {
    id: 'cross-hatch',
    name: 'Cross',
    getCSS: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(0,0,0,0.03) 10px,
          rgba(0,0,0,0.03) 20px
        ),
        repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 10px,
          rgba(0,0,0,0.03) 10px,
          rgba(0,0,0,0.03) 20px
        )
      `,
    }),
    preview: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 5px,
          rgba(0,0,0,0.06) 5px,
          rgba(0,0,0,0.06) 10px
        ),
        repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 5px,
          rgba(0,0,0,0.06) 5px,
          rgba(0,0,0,0.06) 10px
        )
      `,
    }),
  },
];

export function getPatternById(id: string): Pattern | undefined {
  return patterns.find(p => p.id === id);
}