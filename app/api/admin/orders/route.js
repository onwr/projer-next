import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const storeId = searchParams.get('storeId') || '';
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const amountMin = searchParams.get('amountMin') || '';
    const amountMax = searchParams.get('amountMax') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where = {};
    if (status) {
      where.status = status;
    }
    
    // Build product where clause
    const productWhere = {};
    if (storeId) {
      productWhere.authorId = storeId;
    }
    if (category) {
      productWhere.category = category;
    }
    if (Object.keys(productWhere).length > 0) {
      where.product = productWhere;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    if (amountMin || amountMax) {
      where.amount = {};
      if (amountMin) where.amount.gte = parseFloat(amountMin);
      if (amountMax) where.amount.lte = parseFloat(amountMax);
    }
    // Search için ayrı where clause (MySQL contains sorunu için client-side filtering yapacağız)
    const searchWhere = { ...where };
    if (search) {
      // Order ID için özel kontrol - eğer search sadece order ID formatında ise direkt ara
      const searchLower = search.toLowerCase().trim();
      
      // Önce Order ID'ye göre direkt arama yapmayı dene
      try {
        const orderById = await prisma.order.findUnique({
          where: { id: search },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                category: true,
                subcategory: true,
                price: true,
                isFree: true,
                author: {
                  select: {
                    id: true,
                    storeName: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        });
        
        if (orderById) {
          // Order ID bulundu, diğer filtreleri de kontrol et
          let matches = true;
          if (status && orderById.status !== status) matches = false;
          if (storeId && orderById.product?.author?.id !== storeId) matches = false;
          if (category && orderById.product?.category !== category) matches = false;
          if (dateFrom && new Date(orderById.createdAt) < new Date(dateFrom)) matches = false;
          if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            if (new Date(orderById.createdAt) > endDate) matches = false;
          }
          if (amountMin && parseFloat(orderById.amount.toString()) < parseFloat(amountMin)) matches = false;
          if (amountMax && parseFloat(orderById.amount.toString()) > parseFloat(amountMax)) matches = false;
          
          if (matches) {
            // Tüm filtreleri geçti, sadece bu order'ı döndür
            const ordersFormatted = [{
              id: orderById.id,
              amount: parseFloat(orderById.amount.toString()),
              status: orderById.status,
              createdAt: orderById.createdAt,
              updatedAt: orderById.updatedAt,
              user: orderById.user,
              product: {
                ...orderById.product,
                price: parseFloat(orderById.product.price.toString()),
              },
            }];
            
            return NextResponse.json({
              ok: true,
              orders: ordersFormatted,
              total: 1,
              page: 1,
              pageSize: 1,
            });
          }
        }
      } catch (error) {
        // Order ID bulunamadı veya hata, normal aramaya devam et
      }
      
      // Order ID bulunamadı, normal arama yap
      const searchConditions = [
        {
          user: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
            ],
          },
        },
        {
          product: {
            title: { contains: search },
          },
        },
      ];
      
      // If productWhere exists, merge with search
      if (Object.keys(productWhere).length > 0) {
        searchConditions[1].product = {
          ...productWhere,
          title: { contains: search },
        };
        delete searchWhere.product;
      }
      
      searchWhere.OR = searchConditions;
    }

    // Debug: log where clause
    console.log('[/api/admin/orders] Where clause:', JSON.stringify(searchWhere, null, 2));

    // Client-side filtering için önce tüm siparişleri çek (Order ID araması için)
    let allOrders = [];
    let totalCount = 0;
    
    if (search) {
      // Search varsa, tüm siparişleri çek ve client-side filtrele
      const [allOrdersData, allCount] = await Promise.all([
        prisma.order.findMany({
          where: {
            ...(status ? { status } : {}),
            ...(dateFrom || dateTo ? {
              createdAt: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? {
                  lte: (() => {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    return endDate;
                  })()
                } : {}),
              },
            } : {}),
            ...(amountMin || amountMax ? {
              amount: {
                ...(amountMin ? { gte: parseFloat(amountMin) } : {}),
                ...(amountMax ? { lte: parseFloat(amountMax) } : {}),
              },
            } : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                category: true,
                subcategory: true,
                price: true,
                isFree: true,
                author: {
                  select: {
                    id: true,
                    storeName: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        }),
        prisma.order.count({
          where: {
            ...(status ? { status } : {}),
            ...(dateFrom || dateTo ? {
              createdAt: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? {
                  lte: (() => {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    return endDate;
                  })()
                } : {}),
              },
            } : {}),
            ...(amountMin || amountMax ? {
              amount: {
                ...(amountMin ? { gte: parseFloat(amountMin) } : {}),
                ...(amountMax ? { lte: parseFloat(amountMax) } : {}),
              },
            } : {}),
          },
        }),
      ]);
      
      // Client-side filtering
      const searchLower = search.toLowerCase().trim();
      allOrders = allOrdersData.filter(order => {
        // Order ID kontrolü
        if (order.id.toLowerCase().includes(searchLower)) return true;
        
        // User bilgileri
        const user = order.user;
        if (user) {
          if (user.firstName?.toLowerCase().includes(searchLower)) return true;
          if (user.lastName?.toLowerCase().includes(searchLower)) return true;
          if (user.email?.toLowerCase().includes(searchLower)) return true;
        }
        
        // Product bilgileri
        const product = order.product;
        if (product) {
          if (product.title?.toLowerCase().includes(searchLower)) return true;
        }
        
        // Store filter
        if (storeId && product?.author?.id !== storeId) return false;
        
        // Category filter
        if (category && product?.category !== category) return false;
        
        return false;
      });
      
      totalCount = allOrders.length;
      
      // Sorting
      if (sortBy === 'createdAt' || sortBy === 'amount' || sortBy === 'status') {
        allOrders.sort((a, b) => {
          let aValue, bValue;
          if (sortBy === 'createdAt') {
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
          } else if (sortBy === 'amount') {
            aValue = parseFloat(a.amount.toString());
            bValue = parseFloat(b.amount.toString());
          } else {
            aValue = a.status;
            bValue = b.status;
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          }
        });
      }
      
      // Pagination
      allOrders = allOrders.slice(skip, skip + pageSize);
    } else {
      // Search yoksa normal query
      const [ordersData, count] = await Promise.all([
        prisma.order.findMany({
          where: searchWhere,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                category: true,
                subcategory: true,
                price: true,
                isFree: true,
                author: {
                  select: {
                    id: true,
                    storeName: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        }),
        prisma.order.count({ where: searchWhere }),
      ]);
      
      allOrders = ordersData;
      totalCount = count;
    }

    console.log('[/api/admin/orders] Found orders:', allOrders.length, 'Total:', totalCount);

    const ordersFormatted = allOrders.map((order) => ({
      id: order.id,
      amount: parseFloat(order.amount.toString()),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      product: {
        ...order.product,
        price: parseFloat(order.product.price.toString()),
      },
    }));

    return NextResponse.json({
      ok: true,
      orders: ordersFormatted,
      total: totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[/api/admin/orders] Error:', error);
    console.error('[/api/admin/orders] Error stack:', error.stack);
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Order ID and status required' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    // Eğer sipariş iptal edildiyse, bakiye güncellemesi yapılabilir
    if (status === 'CANCELLED') {
      // TODO: Bakiye geri verme işlemi (gerekirse)
    }

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error('[/api/admin/orders PATCH] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

