import * as semantic from 'semantic-release';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, success, verifyConditions } from './index';

type SuccessContextWithBranch = semantic.SuccessContext & { branch?: { name: string } };
type FailContextWithBranch = semantic.FailContext & { branch?: { name: string } };

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

    it('should skip verification when current branch does not match allowed branches', async () => {
      vi.unstubAllEnvs();
      const logger = { log: vi.fn() };

      await expect(
        verifyConditions({ branches: ['main'] }, {
          branch: { name: 'develop' },
          logger
        } as unknown as SuccessContextWithBranch)
      ).resolves.not.toThrow();

      expect(logger.log).toHaveBeenCalledWith(
        'Skipping Discord notification because branch "develop" does not match allowed branches: main'
      );
    });

    it('should still enforce webhook configuration when branch matches', async () => {
      vi.unstubAllEnvs();

      await expect(
        verifyConditions({ branches: ['main'] }, {
          branch: { name: 'main' },
          logger: console
        } as unknown as SuccessContextWithBranch)
      ).rejects.toThrow(
        'No Discord webhook URL provided. Set it in the plugin config or as DISCORD_WEBHOOK environment variable.'
      );
    });
  });

  describe('success', () => {
    const context: SuccessContextWithBranch = {
      logger: console,
      nextRelease: {
        version: '1.0.0',
        notes: 'Release notes'
      }
    } as SuccessContextWithBranch;

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

    it('should skip success notification when branch does not match configuration', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      const logger = { log: vi.fn() };
      const contextWithBranch: SuccessContextWithBranch = {
        ...context,
        logger,
        branch: { name: 'develop' }
      } as SuccessContextWithBranch;

      await success({ branches: ['main'] }, contextWithBranch);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        'Skipping Discord notification because branch "develop" does not match allowed branches: main'
      );
    });

    it('should skip success notification when branch info is missing', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      const logger = { log: vi.fn() };
      const contextWithoutBranch: SuccessContextWithBranch = {
        ...context,
        logger
      } as SuccessContextWithBranch;

      await success({ branches: ['main'] }, contextWithoutBranch);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        'Skipping Discord notification because the current branch name is not available.'
      );
    });

    it('should allow extglob branch patterns similar to semantic-release', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      const patternContext: SuccessContextWithBranch = {
        logger: console,
        nextRelease: {
          version: '1.0.0',
          notes: 'Release notes'
        },
        branch: { name: 'v1.2.x' }
      } as SuccessContextWithBranch;

      await success({ branches: ['v+([0-9])?(.{+([0-9]),x}).x'] }, patternContext);

      expect(fetchMock).toHaveBeenCalled();
    });

    describe('variable replacement', () => {
      const context: SuccessContextWithBranch = {
        logger: console,
        nextRelease: {
          version: '1.0.0',
          notes: 'Release notes'
        }
      } as SuccessContextWithBranch;

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

      it('should handle new lines in variables', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = fetchMock;

        const contextWithLines: SuccessContextWithBranch = {
          logger: console,
          nextRelease: {
            version: '1.0.0',
            notes: `Release notes

with new lines
and
more new lines`
          }
        } as SuccessContextWithBranch;

        const pluginConfig = {
          embedJson: {
            content: '${nextRelease.notes}'
          }
        };

        await success(pluginConfig, contextWithLines);

        expect(fetchMock).toHaveBeenCalledWith(
          'https://discord.com/api/webhooks/test',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{"content":"Release notes\\n\\nwith new lines\\nand\\nmore new lines"}'
          })
        );
      });
    });
  });

  describe('fail', () => {
    const context = {
      errors: { errors: [{ message: 'whoops' }], name: 'something', message: 'Error message' },
      stdout: '',
      stderr: '',
      logger: console,
      branch: { name: 'main' }
    } as unknown as FailContextWithBranch;

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

    it('should skip failure notifications when branch filter does not match', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      const mismatchContext = { ...context, branch: { name: 'develop' } } as FailContextWithBranch;

      await fail({ branches: ['release/*'] }, mismatchContext);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should skip failure notifications when branch info is missing', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      const logger = { log: vi.fn() };

      await fail({ branches: ['main'] }, { ...context, branch: undefined, logger } as unknown as FailContextWithBranch);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        'Skipping Discord notification because the current branch name is not available.'
      );
    });
  });
});
