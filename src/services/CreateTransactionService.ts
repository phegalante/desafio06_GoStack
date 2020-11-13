import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute(request: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const { title, value, type, category } = request;
    const findCategoryByName = await categoryRepository.findOne({
      where: { title: category },
    });
    let category_id;

    if (findCategoryByName) {
      category_id = findCategoryByName.id;
    } else {
      const createdCategory = categoryRepository.create({
        title: category,
      });
      category_id = createdCategory.id;
    }

    const transaction = await transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    const balance = await transactionRepository.getBalance();

    if (transaction.type === 'outcome' && balance.total < transaction.value) {
      throw new AppError('Você não tem saldo suficiente para essa transação!');
    }

    return transaction;
  }
}

export default CreateTransactionService;
