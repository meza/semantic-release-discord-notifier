import * as semantic from 'semantic-release';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, success, verifyConditions } from './index';

describe('Semantic Release Discord Notifier', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('DISCORD_WEBHOOK', 'https://discord.com/api/webhooks/test');
  });
  describe('verifyConditions', () => {
    it('should throw an error if no webhook URL is provided', async () => {
      vi.unstubAllEnvs();
      await expect(verifyConditions({})).rejects.toThrow(
        'No Discord webhook URL provided. Set it in the plugin config or as DISCORD_WEBHOOK environment variable.'
      );
    });

    it('should not throw an error if webhook URL is provided in plugin config', async () => {
      await expect(verifyConditions({ webhookUrl: 'https://discord.com/api/webhooks/test' })).resolves.not.toThrow();
    });

    it('should not throw an error if webhook URL is provided in environment variables', async () => {
      await expect(verifyConditions({})).resolves.not.toThrow();
    });
  });

  describe('success', () => {
    const context: semantic.SuccessContext = {
      logger: console,
      nextRelease: {
        version: '1.0.0',
        notes: 'Release notes'
      }
    } as semantic.SuccessContext;

    it('should throw an error if no webhook URL is set', async () => {
      vi.unstubAllEnvs();
      await expect(success({}, context)).rejects.toThrow('Discord webhook URL is not set.');
    });

    it('should send a success notification with default embed JSON', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      await success({}, context);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'New Release: 1.0.0',
            embeds: [
              {
                title: 'What changed?',
                description: 'Release notes',
                color: 7377919
              }
            ]
          })
        })
      );
    });
    it('should throw an error if no release information is available', async () => {
      await expect(success({}, {} as semantic.SuccessContext)).rejects.toThrow('No release information available.');
    });
    it('should handle errors when sending a success notification', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      consoleSpy.mockImplementation(() => {});
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = fetchMock;

      await expect(success({}, context)).rejects.toThrow('Network error');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send Discord notification:', expect.any(Error));
    });

    it('should handle http errors when sending a success notification', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      consoleSpy.mockImplementation(() => {});
      const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      global.fetch = fetchMock;

      await expect(success({}, context)).rejects.toThrow('HTTP error! status: 500');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send Discord notification:', expect.any(Error));
    });

    describe('variable replacement', () => {
      const context: semantic.SuccessContext = {
        logger: console,
        nextRelease: {
          version: '1.0.0',
          notes: 'Release notes'
        }
      } as semantic.SuccessContext;

      it('should replace variables in the embed JSON and send a success notification', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = fetchMock;

        const pluginConfig = {
          embedJson: {
            title: 'New Release: ${nextRelease.version}',
            description: '${nextRelease.notes}',
            color: 5814783
          }
        };

        await success(pluginConfig, context);

        expect(fetchMock).toHaveBeenCalledWith(
          'https://discord.com/api/webhooks/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'New Release: 1.0.0',
              description: 'Release notes',
              color: 5814783
            })
          })
        );
      });

      it('should leave variables unchanged if they do not exist in the context', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = fetchMock;

        const pluginConfig = {
          embedJson: {
            title: 'New Release: ${nextRelease.nonExistent}',
            description: '${nextRelease.notes}',
            color: 5814783
          }
        };

        await success(pluginConfig, context);

        expect(fetchMock).toHaveBeenCalledWith(
          'https://discord.com/api/webhooks/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'New Release: ${nextRelease.nonExistent}',
              description: 'Release notes',
              color: 5814783
            })
          })
        );
      });

      it('should handle nested variables in the embed JSON', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = fetchMock;

        const pluginConfig = {
          embedJson: {
            title: 'New Release: ${nextRelease.version}',
            details: {
              notes: '${nextRelease.notes}'
            },
            color: 5814783
          }
        };

        await success(pluginConfig, context);

        expect(fetchMock).toHaveBeenCalledWith(
          'https://discord.com/api/webhooks/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'New Release: 1.0.0',
              details: {
                notes: 'Release notes'
              },
              color: 5814783
            })
          })
        );
      });

      it('should handle empty embed JSON', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = fetchMock;

        const pluginConfig = {
          embedJson: {}
        };

        await success(pluginConfig, context);

        expect(fetchMock).toHaveBeenCalledWith(
          'https://discord.com/api/webhooks/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
        );
      });
    });
  });

  describe('fail', () => {
    const context: semantic.FailContext = {
      errors: { errors: [{ message: 'whoops' }], name: 'something', message: 'Error message' },
      stdout: '',
      stderr: '',
      logger: console
    } as unknown as semantic.FailContext;

    it('should throw an error if no webhook URL is set', async () => {
      vi.unstubAllEnvs();
      await expect(fail({}, context)).rejects.toThrow('Discord webhook URL is not set.');
    });

    it('should send a failure notification with default embed JSON', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      await fail({}, context);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Release Failed',
            embeds: [
              {
                title: 'Error',
                description: 'whoops',
                color: 15158332
              }
            ]
          })
        })
      );
    });
    it('should handle errors when sending a failure notification', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      consoleSpy.mockImplementation(() => {});
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = fetchMock;

      await expect(fail({}, context)).rejects.toThrow('Network error');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send Discord notification:', expect.any(Error));
    });
    it('should handle http errors when sending a failure notification', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      consoleSpy.mockImplementation(() => {});
      const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      global.fetch = fetchMock;

      await expect(fail({}, context)).rejects.toThrow('HTTP error! status: 500');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send Discord notification:', expect.any(Error));
    });
  });
});
