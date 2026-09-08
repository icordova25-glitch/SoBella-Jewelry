import ProductCard from "@/components/ProductCard";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_urls: string[] | null;
};

type CategoryCard = {
  key: string;
  label: string;
  placeholder: string;
};

const CATEGORY_CARDS: CategoryCard[] = [
  { key: "earrings", label: "Earrings", placeholder: "/assets/placeholders/earrings.svg" },
  { key: "rings", label: "Rings", placeholder: "/assets/placeholders/rings.svg" },
  { key: "necklaces", label: "Necklaces", placeholder: "/assets/placeholders/necklaces.svg" },
  { key: "bracelets", label: "Bracelets", placeholder: "/assets/placeholders/bracelets.svg" },
];

function normalizeCategory(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export default async function HomePage() {
  const supabase = createSupabasePublicServerClient();

  if (!supabase) {
    return (
      <section>
        <h1 className="sr-only">SOBELLA JEWELRY CO.</h1>
        <img className="hero-logo" src="/assets/logo/sobella-logo.svg" alt="SOBELLA JEWELRY CO." />
        <p>Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load products.</p>
      </section>
    );
  }

  const { data } = await supabase
    .from("products")
    .select("id, name, description, price, category, image_urls")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const featured: ProductRow[] = data || [];
  const categoryRows = featured.reduce<Record<string, ProductRow>>((accumulator, product) => {
    const category = normalizeCategory(product.category);
    if (category && !accumulator[category]) {
      accumulator[category] = product;
    }
    return accumulator;
  }, {});

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Fine Jewelry For Everyday Rituals</p>
        <h1 className="sr-only">SOBELLA JEWELRY CO.</h1>
        <img className="hero-logo" src="/assets/logo/sobella-logo.svg" alt="SOBELLA JEWELRY CO." />
        <p className="lead">Refined gold tones, clean silhouettes, and modern classics designed to stack, layer, and glow from morning through evening.</p>
      </div>

      <div className="hero-accent panel">
        <p className="accent-kicker">SOBELLA JEWELRY CO.</p>
        <p className="accent-quote">Wear it. Live in it. Love it.</p>
        <p className="accent-copy">Intentional pieces with a soft-luxury finish, designed to feel effortless on a phone screen and elevated in person.</p>
      </div>

      <div className="section-heading">
        <p className="eyebrow">Featured Collection</p>
        <h2>New Arrivals And Timeless Staples</h2>
      </div>

      <div className="category-showcase">
        {CATEGORY_CARDS.map((category) => {
          const matchedProduct = categoryRows[category.key];
          const imageUrl = matchedProduct?.image_urls?.[0] || category.placeholder;
          const productName = matchedProduct?.name || `Add ${category.label.toLowerCase()} imagery`;
          return (
            <a key={category.key} className="category-card panel" href="/products">
              <img src={imageUrl} alt={category.label} />
              <div className="category-card-copy">
                <h3>{category.label}</h3>
                <p>{matchedProduct ? productName : "Placeholder image until the admin uploads one."}</p>
              </div>
            </a>
          );
        })}
      </div>

      <div className="grid product-grid">
        {featured.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              description: product.description || undefined,
              price: Number(product.price),
              imageUrl: product.image_urls?.[0],
            }}
          />
        ))}
      </div>
    </section>
  );
}
