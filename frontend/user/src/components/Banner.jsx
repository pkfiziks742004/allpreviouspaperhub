import { useEffect, useState } from "react";
import axios from "axios";
import { Carousel } from "react-bootstrap";
import { API_BASE, resolveApiUrl } from "../config/api";

export default function Banner() {
  const [images, setImages] = useState([]);
  const [ready, setReady] = useState(false);
  const [bannerMargin, setBannerMargin] = useState(0);
  const [bannerRadius, setBannerRadius] = useState(0);

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/settings`)
      .then(res => {
        if (res.data && Array.isArray(res.data.bannerImages) && res.data.bannerImages.length > 0) {
          setImages(res.data.bannerImages);
        } else {
          setImages([]);
        }
        if (res.data && res.data.bannerMargin !== undefined) {
          setBannerMargin(Number(res.data.bannerMargin || 0));
        }
        if (res.data && res.data.bannerRadius !== undefined) {
          setBannerRadius(Number(res.data.bannerRadius || 0));
        }
      })
      .catch(() => {
        setImages([]);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready || images.length === 0) return null;

  return (
    <div style={{ margin: `${bannerMargin}px` }}>
      <div style={{ borderRadius: `${bannerRadius}px`, overflow: "hidden" }}>
        <Carousel interval={3000} pause={false}>
          {images.map((src, i) => (
            <Carousel.Item key={src + i}>
              <img
                className="d-block w-100 banner-img"
                src={resolveUrl(src)}
                alt={`Banner ${i + 1}`}
                loading="lazy"
              />
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </div>
  );
}
