'use client'
import { Box } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface DashboardSwiperProps {
  items: { title: string; chart: React.ReactNode }[];
}

export default function DashboardSwiper({ items }: DashboardSwiperProps) {
  return (
    <Box
      sx={{
        width: '100%',
        mt: 3,
        maxWidth: { xs: '100vw', sm: 500, md: 600 },
        mx: 'auto',
        px: { xs: 1, sm: 2 },
        overflowX: 'hidden',
        transition: 'max-width 0.3s',
      }}
    >
      <Swiper
        modules={[Pagination]}
        pagination={{ clickable: true, dynamicBullets: false }}
        spaceBetween={0}
        slidesPerView={1}
        style={{ paddingBottom: 32, width: '100%' }}
      >
        {items.map((item, idx) => (
          <SwiperSlide key={idx}>
            <Box sx={{
              width: '100%',
              minHeight: 180,
              display: 'flex',
              justifyContent: 'stretch',
              alignItems: 'stretch',
              px: 0,
              py: 0,
            }}>
              {/* Gráfico ocupa toda a largura, sem assimetria */}
              <Box sx={{
                width: '100%',
                maxWidth: '100%',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'stretch',
              }}>
                {item.chart}
              </Box>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Customização dos dots do Swiper */}
      <style>{`
        .swiper-pagination-bullets {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 12px;
        }
        .swiper-pagination-bullet {
          width: 14px;
          height: 14px;
          background: #444;
          opacity: 1;
          margin: 0 6px;
          border-radius: 50%;
          transition: background 0.3s, transform 0.3s;
        }
        .swiper-pagination-bullet-active {
          background: #fff;
          transform: scale(1.2);
          box-shadow: 0 0 0 2px #23272f;
        }
      `}</style>
    </Box>
  );
}
