type Props = {
  category: string; // 'physical' | 'special' | 'status'
  className?: string;
};

export default function CategoryBadge({ category, className = 'h-7' }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/categories/${category.toLowerCase()}.png`}
      alt={category.charAt(0).toUpperCase() + category.slice(1)}
      className={`inline-block ${className}`}
    />
  );
}
