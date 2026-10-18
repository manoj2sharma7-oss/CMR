import { Star } from 'lucide-react';

/** Three stars, `count` of them filled. */
export default function Stars({ count, size = 20, className = '' }) {
  return (
    <span className={`stars ${className}`} role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <Star key={n} size={size} className={n <= count ? 'star star--on' : 'star'} aria-hidden="true" />
      ))}
    </span>
  );
}
