import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="panel product-card">
      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : null}
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <strong className="price">${product.price.toFixed(2)}</strong>
      <p>
        <Link href={`/products/${product.id}`} className="text-link">
          View details
        </Link>
      </p>
    </article>
  );
}
