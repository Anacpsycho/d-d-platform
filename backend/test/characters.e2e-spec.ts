import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { CharactersModule } from '../src/modules/characters/characters.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { ConfigModule } from '@nestjs/config';

describe('CharactersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let characterId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        MongooseModule.forRoot(process.env.DATABASE_URL || 'mongodb://localhost:27017/dnd-test'),
        AuthModule,
        UsersModule,
        CharactersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!@#',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

    authToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/characters (POST)', () => {
    it('should create a new character', () => {
      const createCharacterDto = {
        characterName: 'Test Character',
        playerName: 'Test Player',
        race: 'Human',
        background: 'Soldier',
        alignment: 'Lawful Good',
        level: 1,
        abilityScores: {
          cols: [
            { type: 'base', scores: [15, 14, 13, 12, 10, 8, 0] },
            { type: 'race', scores: [1, 1, 0, 0, 0, 0, 0] },
            { type: 'maximum', scores: [20, 20, 20, 20, 20, 20, 20] },
          ],
        },
        classes: [
          {
            classKey: 'fighter',
            level: 1,
            name: 'Fighter',
            hitDice: 'd10',
          },
        ],
        maxHitPoints: 12,
        sourcesConfig: {
          allowedSources: ['PHB'],
          excludedResources: {},
        },
      };

      return request(app.getHttpServer())
        .post('/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createCharacterDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('_id');
          expect(response.body.characterName).toBe('Test Character');
          expect(response.body.level).toBe(1);
          expect(response.body.proficiencyBonus).toBe(2);
          characterId = response.body._id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/characters')
        .send({})
        .expect(401);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          characterName: '', // Invalid: empty name
        })
        .expect(400);
    });
  });

  describe('/characters (GET)', () => {
    it('should return all characters for the user', () => {
      return request(app.getHttpServer())
        .get('/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/characters')
        .expect(401);
    });
  });

  describe('/characters/:id (GET)', () => {
    it('should return a specific character', () => {
      return request(app.getHttpServer())
        .get(`/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(characterId);
          expect(response.body.characterName).toBe('Test Character');
        });
    });

    it('should fail for non-existent character', () => {
      return request(app.getHttpServer())
        .get('/characters/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/characters/:id (PATCH)', () => {
    it('should update a character', () => {
      return request(app.getHttpServer())
        .patch(`/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          characterName: 'Updated Character',
          currentHitPoints: 10,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.characterName).toBe('Updated Character');
          expect(response.body.currentHitPoints).toBe(10);
        });
    });

    it('should recalculate stats when level changes', () => {
      return request(app.getHttpServer())
        .patch(`/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          level: 5,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.level).toBe(5);
          expect(response.body.proficiencyBonus).toBe(3);
        });
    });

    it('should fail with invalid HP values', () => {
      return request(app.getHttpServer())
        .patch(`/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentHitPoints: 100,
          maxHitPoints: 50, // Current > Max
        })
        .expect(400);
    });
  });

  describe('/characters/:id/level-up (POST)', () => {
    it('should level up a character', () => {
      return request(app.getHttpServer())
        .post(`/characters/${characterId}/level-up`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          classKey: 'fighter',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.level).toBe(6);
          expect(response.body.maxHitPoints).toBeGreaterThan(12);
        });
    });

    it('should fail for non-existent class', () => {
      return request(app.getHttpServer())
        .post(`/characters/${characterId}/level-up`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          classKey: 'nonexistent',
        })
        .expect(404);
    });
  });

  describe('/characters/:id (DELETE)', () => {
    it('should delete a character', () => {
      return request(app.getHttpServer())
        .delete(`/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should fail to get deleted character', () => {
      return request(app.getHttpServer())
        .get(`/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Character Calculations', () => {
    let testCharacterId: string;

    beforeAll(async () => {
      // Create a character for calculation tests
      const response = await request(app.getHttpServer())
        .post('/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          characterName: 'Calculation Test',
          level: 5,
          abilityScores: {
            cols: [
              { type: 'base', scores: [16, 14, 15, 10, 12, 8, 0] },
              { type: 'race', scores: [2, 0, 1, 0, 0, 0, 0] },
              { type: 'maximum', scores: [20, 20, 20, 20, 20, 20, 20] },
            ],
          },
          classes: [
            {
              classKey: 'wizard',
              level: 5,
              name: 'Wizard',
              hitDice: 'd6',
              spellcastingFactor: 1,
            },
          ],
          maxHitPoints: 30,
          spellcastingAbility: 'int',
          sourcesConfig: {
            allowedSources: ['PHB'],
            excludedResources: {},
          },
        });

      testCharacterId = response.body._id;
    });

    it('should have correct ability modifiers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/characters/${testCharacterId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // STR: 18 (16+2) = +4
      // DEX: 14 = +2
      // CON: 16 (15+1) = +3
      // INT: 10 = +0
      expect(response.body.proficiencyBonus).toBe(3);
    });

    it('should have correct spell slots for level 5 wizard', async () => {
      const response = await request(app.getHttpServer())
        .get(`/characters/${testCharacterId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.spellSlots).toBeDefined();
      expect(response.body.spellSlots['1']).toEqual({ max: 4, used: 0 });
      expect(response.body.spellSlots['2']).toEqual({ max: 3, used: 0 });
      expect(response.body.spellSlots['3']).toEqual({ max: 2, used: 0 });
    });

    it('should have correct spell save DC', async () => {
      const response = await request(app.getHttpServer())
        .get(`/characters/${testCharacterId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Spell Save DC = 8 + proficiency (3) + INT modifier (0) = 11
      expect(response.body.spellSaveDC).toBe(11);
    });

    it('should have correct spell attack bonus', async () => {
      const response = await request(app.getHttpServer())
        .get(`/characters/${testCharacterId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Spell Attack = proficiency (3) + INT modifier (0) = 3
      expect(response.body.spellAttackBonus).toBe(3);
    });
  });
});

// Made with Bob
