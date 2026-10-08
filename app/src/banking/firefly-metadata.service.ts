import { HttpException, Injectable, Logger } from '@nestjs/common';

/**
 * Ensures budgets/categories/tags exist in Firefly III before they're referenced
 * on a transaction, creating them on first use.
 *
 * Why this is needed at all: on transaction store, Firefly auto-creates an unknown
 * `category_name`, but it does NOT auto-create an unknown `budget_name` (the value
 * is just ignored if it doesn't resolve to an existing budget). Tags are auto-created
 * regardless. So `ensureBudget` is the one that actually matters; `ensureCategory`
 * and `ensureTag` are here for symmetry / explicitness, not because Firefly requires it.
 *
 * Env vars required:
 *   FIREFLY_API_URL   - e.g. https://firefly.example.com
 *   FIREFLY_API_TOKEN - Personal Access Token (Profile -> OAuth -> Personal Access Tokens)
 */

interface Pagination {
  total_pages: number;
}

interface FireflyListResponse<TAttrs> {
  data: Array<{ id: string; attributes: TAttrs }>;
  meta: { pagination: Pagination };
}

interface FireflySingleResponse<TAttrs> {
  data: { id: string; attributes: TAttrs };
}

interface BudgetAttributes {
  name: string;
}

interface CategoryAttributes {
  name: string;
}

interface TagAttributes {
  tag: string;
}

type Resource = 'budgets' | 'categories' | 'tags';

@Injectable()
export class FireflyMetadataService {
  private readonly logger = new Logger(FireflyMetadataService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = process.env.FIREFLY_API_URL;
    this.token = process.env.FIREFLY_API_TOKEN;
  }

  /** Returns the budget's id, creating the budget first if it doesn't exist. */
  async ensureBudget(name: string): Promise<string> {
    return this.ensureResource<BudgetAttributes>(
      'budgets',
      name,
      (attrs) => attrs.name,
      { name },
    );
  }

  /** Returns the category's id, creating the category first if it doesn't exist. */
  async ensureCategory(name: string): Promise<string> {
    return this.ensureResource<CategoryAttributes>(
      'categories',
      name,
      (attrs) => attrs.name,
      { name },
    );
  }

  /**
   * Returns the tag's id, creating it first if it doesn't exist.
   * Usually unnecessary: Firefly creates unknown tags automatically when you
   * submit a transaction with them in the `tags` array.
   */
  async ensureTag(tag: string): Promise<string> {
    return this.ensureResource<TagAttributes>(
      'tags',
      tag,
      (attrs) => attrs.tag,
      { tag },
    );
  }

  private async ensureResource<TAttrs>(
    resource: Resource,
    name: string,
    getName: (attrs: TAttrs) => string,
    createBody: Record<string, string>,
  ): Promise<string> {
    const existingId = await this.findByName<TAttrs>(resource, name, getName);
    if (existingId) {
      return existingId;
    }

    this.logger.log(`Creating Firefly ${resource.slice(0, -1)} "${name}" (not found)`);
    const created = await this.request<FireflySingleResponse<TAttrs>>(resource, {
      method: 'POST',
      body: JSON.stringify(createBody),
    });
    return created.data.id;
  }

  private async findByName<TAttrs>(
    resource: Resource,
    name: string,
    getName: (attrs: TAttrs) => string,
  ): Promise<string | null> {
    const target = name.trim().toLowerCase();
    let page = 1;
    let totalPages = 1;

    do {
      const result = await this.request<FireflyListResponse<TAttrs>>(
        `${resource}?limit=200&page=${page}`,
      );
      const match = result.data.find(
        (item) => getName(item.attributes).trim().toLowerCase() === target,
      );
      if (match) {
        return match.id;
      }
      totalPages = result.meta.pagination.total_pages;
      page += 1;
    } while (page <= totalPages);

    return null;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new HttpException(
        `Firefly III API error (${response.status}) on ${path}: ${body}`,
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }
}