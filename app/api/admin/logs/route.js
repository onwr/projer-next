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
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const action = searchParams.get('action') || '';
    const userId = searchParams.get('userId') || '';
    const ipAddress = searchParams.get('ipAddress') || '';
    const country = searchParams.get('country') || '';
    const entityType = searchParams.get('entityType') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where = {};
    if (action) {
      where.action = action;
    }
    if (userId) {
      where.userId = userId;
    }
    if (ipAddress) {
      where.ipAddress = { contains: ipAddress };
    }
    if (country) {
      where.country = country;
    }
    if (entityType) {
      where.entityType = entityType;
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

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
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
              storeName: true,
              profileImage: true,
              userType: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // İstatistikler
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayCount, weekCount, topActions, topCountries, topBrowsers, topDevices] = await Promise.all([
      prisma.activityLog.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.activityLog.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      prisma.activityLog.groupBy({
        by: ['browser'],
        where: { browser: { not: null } },
        _count: { browser: true },
        orderBy: { _count: { browser: 'desc' } },
        take: 10,
      }),
      prisma.activityLog.groupBy({
        by: ['device'],
        where: { device: { not: null } },
        _count: { device: true },
        orderBy: { _count: { device: 'desc' } },
        take: 10,
      }),
    ]);

    const logsFormatted = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      ipAddress: log.ipAddress,
      country: log.country,
      countryCode: log.countryCode,
      city: log.city,
      region: log.region,
      timezone: log.timezone,
      isp: log.isp,
      browser: log.browser,
      browserVersion: log.browserVersion,
      os: log.os,
      osVersion: log.osVersion,
      device: log.device,
      referer: log.referer,
      url: log.url,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      user: log.user,
    }));

    return NextResponse.json({
      ok: true,
      logs: logsFormatted,
      total,
      page,
      pageSize,
      stats: {
        todayCount,
        weekCount,
        topActions: topActions.map((a) => ({ action: a.action, count: a._count.action })),
        topCountries: topCountries.map((c) => ({ country: c.country, count: c._count.country })),
        topBrowsers: topBrowsers.map((b) => ({ browser: b.browser, count: b._count.browser })),
        topDevices: topDevices.map((d) => ({ device: d.device, count: d._count.device })),
      },
    });
  } catch (error) {
    console.error('[/api/admin/logs] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

