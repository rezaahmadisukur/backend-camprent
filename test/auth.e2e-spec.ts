import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Authentication & Product (e2e)', () => {
  let app: INestApplication<App>;
  let access_token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Test without token - should failed
  it('/product (POST) - Unauthorized tanpa token', async () => {
    const res = await request(app.getHttpServer()).post('/product').send({
      name: 'Deluxe Camp Kitchen Set',
      price: 60000,
      stock: 15,
      categoryId: 2,
    });

    expect(res.status).toBe(401);
  });

  // Test Login - Success and Get Token
  it('/auth/login (POST) - ambil token', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'johndoe@email.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    access_token = res.body.access_token;
    expect(access_token).toBeDefined();
  });

  it('/product (POST) - Success dengan token', async () => {
    const res = await request(app.getHttpServer())
      .post('/product')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        name: 'Deluxe Camp Kitchen Set',
        price: 60000,
        stock: 15,
        categoryId: 2,
      });

    expect(res.status).toBe(201);
  });

  afterAll(async () => {
    await app.close();
  });
});
